import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmdbAccessToken } from '../utils/config';
import { registerDiscoverApi } from './discover-api';
import type { TmdbMoviesRawResponse } from '../types/MoviesTypes';

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getHandler(path: string): RouteHandler {
  const handler = handlers.get(path);
  if (!handler) throw new Error(`No handler registered for ${path}`);
  return handler as RouteHandler;
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

describe('discover API', () => {
  beforeEach(() => {
    handlers.clear();
    registerDiscoverApi(app);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('GET /api/discover/movies', () => {
    it('uses default options and returns supported movie fields', async () => {
      // Arrange
      const rawMovie = {
        adult: true,
        backdrop_path: '/backdrop.jpg',
        genre_ids: [18],
        id: 20,
        original_language: 'en',
        original_title: 'Original',
        overview: 'Overview',
        popularity: 12.5,
        poster_path: '/poster.jpg',
        release_date: '2020-05-01',
        title: 'Movie',
        video: true,
        vote_average: 8,
        vote_count: 100,
      };
      const rawData: TmdbMoviesRawResponse = {
        page: 1,
        results: [rawMovie],
        total_pages: 2,
        total_results: 1,
      };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        { query: { year: '2020' } } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=fr-FR&page=1&region=FR',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${tmdbAccessToken}`,
          }),
        }),
      );
      expect(response.json).toHaveBeenCalledWith({
        page: 1,
        results: [
          {
            backdrop_path: '/backdrop.jpg',
            genre_ids: [18],
            id: 20,
            original_language: 'en',
            original_title: 'Original',
            overview: 'Overview',
            popularity: 12.5,
            poster_path: '/poster.jpg',
            release_date: '2020-05-01',
            title: 'Movie',
            vote_average: 8,
            vote_count: 100,
          },
        ],
        total_pages: 2,
        total_results: 1,
      });
    });

    it('passes custom language, page, and region values to TMDB', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValueOnce(
        tmdbResponse({
          page: 2,
          results: [],
          total_pages: 3,
          total_results: 0,
        }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2020',
            language: 'en-US',
            page: '2',
            region: 'US',
          },
        } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=en-US&page=2&region=US',
        expect.any(Object),
      );
      expect(response.json).toHaveBeenCalledWith({
        page: 2,
        results: [],
        total_pages: 3,
        total_results: 0,
      });
    });

    it('accepts the minimum and maximum supported years', async () => {
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
      for (const year of ['1000', '9999']) {
        await getHandler('/api/discover/movies')(
          { query: { year } } as unknown as Request,
          createResponse(),
          vi.fn(),
        );
      }

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0]?.[0]).toContain(
        'primary_release_year=1000',
      );
      expect(fetchMock.mock.calls[1]?.[0]).toContain(
        'primary_release_year=9999',
      );
    });

    it('defaults empty or non-string optional parameters', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValueOnce(
        tmdbResponse({
          page: 1,
          results: [],
          total_pages: 0,
          total_results: 0,
        }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2020',
            language: '',
            page: ['2'],
            region: { nested: 'US' },
          },
        } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=fr-FR&page=1&region=FR',
        expect.any(Object),
      );
    });

    it('rejects missing or invalid years without calling TMDB', async () => {
      // Arrange
      const invalidQueries: Request['query'][] = [
        {},
        { year: '' },
        { year: '999' },
        { year: '0999' },
        { year: '10000' },
        { year: '20x0' },
        { year: ['2020', '2021'] },
        { year: { nested: '2020' } },
      ];
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const responses = [];
      for (const query of invalidQueries) {
        const response = createResponse();
        await getHandler('/api/discover/movies')(
          { query } as Request,
          response,
          vi.fn(),
        );
        responses.push(response);
      }

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
      const invalidJsonResponse = tmdbResponse({});
      vi.mocked(invalidJsonResponse.json).mockRejectedValueOnce(
        new Error('Invalid JSON'),
      );
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 503))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(invalidJsonResponse);
      vi.stubGlobal('fetch', fetchMock);
      const responses = [createResponse(), createResponse(), createResponse()];

      // Act
      for (const response of responses) {
        await getHandler('/api/discover/movies')(
          { query: { year: '2020' } } as unknown as Request,
          response,
          vi.fn(),
        );
      }

      // Assert
      for (const response of responses) {
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to discover movies',
        });
      }
      expect(console.error).toHaveBeenCalledTimes(3);
    });
  });
});
