import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, listenMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  listenMock: vi.fn((_port: unknown, callback: unknown) => {
    if (typeof callback === 'function') {
      callback();
    }
  }),
}));

vi.mock('express', () => ({
  default: vi.fn(() => ({
    get: getMock,
    listen: listenMock,
  })),
}));

vi.mock('./config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

import './index';

type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

const routeHandlers = new Map<string, RouteHandler>(
  getMock.mock.calls.map(([path, handler]) => [
    path as string,
    handler as RouteHandler,
  ]),
);
const serverWasStarted = listenMock.mock.calls.some(([port]) => port === 3000);

function getRouteHandler(path: string): RouteHandler {
  const handler = routeHandlers.get(path);
  if (!handler) {
    throw new Error(`Route handler not registered: ${path}`);
  }
  return handler;
}

function createResponse() {
  const response = {
    json: vi.fn(),
    send: vi.fn(),
    status: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function createRequest(
  values: {
    params?: Record<string, string>;
    query?: Record<string, string>;
  } = {},
): Request {
  return {
    params: values.params ?? {},
    query: values.query ?? {},
  } as unknown as Request;
}

const rawMovie = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  genre_ids: [18],
  id: 42,
  original_language: 'en',
  original_title: 'A Movie',
  overview: 'A story.',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  release_date: '2025-01-02',
  title: 'Un film',
  video: false,
  vote_average: 7.5,
  vote_count: 100,
};

describe('back-end server routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts the server on port 3000', () => {
    expect(serverWasStarted).toBe(true);
  });

  it('registers the application routes', () => {
    expect([...routeHandlers.keys()]).toEqual([
      '/',
      '/api/movies/popular',
      '/api/movies/:id',
      '/api/health',
    ]);
  });

  it('returns the root greeting', () => {
    const response = createResponse();

    getRouteHandler('/')(createRequest(), response as unknown as Response);

    expect(response.send).toHaveBeenCalledWith('Hello World from TypeScript!');
  });

  it('returns a healthy status', () => {
    const response = createResponse();

    getRouteHandler('/api/health')(
      createRequest(),
      response as unknown as Response,
    );

    expect(response.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('returns popular movies using default query parameters', async () => {
    const rawData = {
      page: 1,
      results: [rawMovie],
      total_pages: 3,
      total_results: 60,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(rawData),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    await getRouteHandler('/api/movies/popular')(
      createRequest(),
      response as unknown as Response,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular?language=fr-FR&page=1&region=FR',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      }),
    );
    expect(response.json).toHaveBeenCalledWith({
      page: rawData.page,
      results: [
        {
          backdrop_path: rawMovie.backdrop_path,
          genre_ids: rawMovie.genre_ids,
          id: rawMovie.id,
          original_language: rawMovie.original_language,
          original_title: rawMovie.original_title,
          overview: rawMovie.overview,
          popularity: rawMovie.popularity,
          poster_path: rawMovie.poster_path,
          release_date: rawMovie.release_date,
          title: rawMovie.title,
          vote_average: rawMovie.vote_average,
          vote_count: rawMovie.vote_count,
        },
      ],
      total_pages: rawData.total_pages,
      total_results: rawData.total_results,
    });
  });

  it('uses supplied query parameters for popular movies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        page: 2,
        results: [],
        total_pages: 0,
        total_results: 0,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getRouteHandler('/api/movies/popular')(
      createRequest({
        query: { language: 'en-US', page: '2', region: 'US' },
      }),
      createResponse() as unknown as Response,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular?language=en-US&page=2&region=US',
      expect.any(Object),
    );
  });

  it('returns an error when the popular-movies request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = createResponse();

    await getRouteHandler('/api/movies/popular')(
      createRequest(),
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch popular movies',
    });
  });

  it.each(['abc', '0', '9007199254740992'])(
    'rejects invalid movie ID %s',
    async (id) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      await getRouteHandler('/api/movies/:id')(
        createRequest({ params: { id } }),
        response as unknown as Response,
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({ error: 'Invalid movie ID' });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('returns movie details from TMDB by id', async () => {
    const movieDetails = { id: 1273221, title: 'Test movie' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(movieDetails),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    await getRouteHandler('/api/movies/:id')(
      createRequest({
        params: { id: '1273221' },
        query: { language: 'en-US' },
      }),
      response as unknown as Response,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/1273221?language=en-US',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      }),
    );
    expect(response.json).toHaveBeenCalledWith(movieDetails);
  });

  it('returns 404 when TMDB does not find the movie', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    const response = createResponse();

    await getRouteHandler('/api/movies/:id')(
      createRequest({ params: { id: '42' } }),
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ error: 'Movie not found' });
  });

  it('returns 500 when TMDB fails to fetch movie details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = createResponse();

    await getRouteHandler('/api/movies/:id')(
      createRequest({ params: { id: '42' } }),
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch movie details',
    });
  });
});
