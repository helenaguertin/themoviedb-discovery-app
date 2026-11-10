import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { registerDiscoverApi } from './discover-api';

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type DiscoverRequestQuery = Request['query'];

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getHandler(): RequestHandler {
  const handler = handlers.get('/api/discover/movies');
  if (!handler) throw new Error('Discover route was not registered');
  return handler;
}

function createResponse() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function tmdbResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

async function requestDiscover(query: DiscoverRequestQuery) {
  const response = createResponse();
  await getHandler()({ query } as Request, response, vi.fn());
  return response;
}

describe('GET /api/discover/movies', () => {
  beforeEach(() => {
    handlers.clear();
    registerDiscoverApi(app);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('discovers one page using defaults and returns converted movies with pagination', async () => {
    // Arrange
    const rawMovie = {
      adult: false,
      backdrop_path: null,
      genre_ids: [35],
      id: 42,
      original_language: 'fr',
      original_title: 'Film',
      overview: 'Résumé',
      popularity: 12.5,
      poster_path: null,
      release_date: '2020-05-01',
      title: 'Film',
      video: false,
      vote_average: 7.5,
      vote_count: 100,
    };
    const rawData = {
      page: 1,
      results: [rawMovie],
      total_pages: 3,
      total_results: 21,
    };
    const fetchMock = vi.fn().mockResolvedValue(tmdbResponse(rawData));
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    // Act
    await getHandler()(
      { query: { year: '2020' } } as Request,
      response,
      vi.fn(),
    );

    // Assert
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
      {
        headers: {
          Authorization: 'Bearer test-access-token',
          'Content-Type': 'application/json;charset=utf-8',
        },
      },
    );
    expect(response.json).toHaveBeenCalledWith({
      page: 1,
      results: [
        {
          backdrop_path: null,
          genre_ids: [35],
          id: 42,
          original_language: 'fr',
          original_title: 'Film',
          overview: 'Résumé',
          popularity: 12.5,
          poster_path: null,
          release_date: '2020-05-01',
          title: 'Film',
          vote_average: 7.5,
          vote_count: 100,
        },
      ],
      total_pages: 3,
      total_results: 21,
    });
  });

  it('forwards custom language, page, and region values', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue(
      tmdbResponse({
        page: 2,
        results: [],
        total_pages: 2,
        total_results: 1,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    // Act
    const response = await requestDiscover({
      year: '2020',
      language: 'en-US',
      page: '2',
      region: 'US',
    } as DiscoverRequestQuery);

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=en-US&page=2&region=US',
      expect.anything(),
    );
    expect(response.json).toHaveBeenCalledWith({
      page: 2,
      results: [],
      total_pages: 2,
      total_results: 1,
    });
  });

  it('uses defaults for empty or non-string optional parameters', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue(
      tmdbResponse({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    // Act
    await requestDiscover({
      year: '2020',
      language: '',
      page: ['2', '3'],
      region: { value: 'US' },
    } as unknown as DiscoverRequestQuery);

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
      expect.anything(),
    );
  });

  it('rejects missing, malformed, out-of-range, repeated, and structured years without calling TMDB', async () => {
    // Arrange
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const invalidQueries: DiscoverRequestQuery[] = [
      {},
      { year: '20' },
      { year: '0200' },
      { year: '0000' },
      { year: '10000' },
      { year: '20a0' },
      { year: ['2020', '2021'] },
      { year: { from: '2020' } },
    ] as unknown as DiscoverRequestQuery[];

    // Act
    const responses = await Promise.all(
      invalidQueries.map((query) => requestDiscover(query)),
    );

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    for (const response of responses) {
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'year must be a four-digit year between 1000 and 9999',
      });
    }
  });

  it('logs TMDB HTTP, network, and JSON errors and returns HTTP 500', async () => {
    // Arrange
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tmdbResponse({}, false, 503))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });
    vi.stubGlobal('fetch', fetchMock);
    const errorSpy = vi.spyOn(console, 'error');

    // Act
    const responses = await Promise.all([
      requestDiscover({ year: '2020' } as DiscoverRequestQuery),
      requestDiscover({ year: '2020' } as DiscoverRequestQuery),
      requestDiscover({ year: '2020' } as DiscoverRequestQuery),
    ]);

    // Assert
    expect(errorSpy).toHaveBeenCalledTimes(3);
    for (const response of responses) {
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Failed to discover movies',
      });
    }
  });
});
