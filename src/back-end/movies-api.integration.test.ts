import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import { get } from 'node:http';

vi.mock('./config', () => ({
  tmdbAccessToken: 'integration-test-token',
}));

import { registerMoviesApi } from './movies-api';

type HttpResponse = {
  status: number;
  body: unknown;
};

function request(port: number, path: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    get({ hostname: '127.0.0.1', port, path }, (response) => {
      const chunks: Buffer[] = [];

      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: response.statusCode ?? 0,
          body: body ? JSON.parse(body) : null,
        });
      });
    }).on('error', reject);
  });
}

describe('movies API HTTP integration', () => {
  let server: ReturnType<ReturnType<typeof express>['listen']>;
  let port: number;
  let tmdbFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const app = express();
    registerMoviesApi(app);

    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    port = (server.address() as AddressInfo).port;
    tmdbFetch = vi.fn();
    vi.stubGlobal('fetch', tmdbFetch);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('serves popular movies and transforms the TMDB response', async () => {
    tmdbFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        page: 2,
        results: [
          {
            adult: false,
            backdrop_path: '/backdrop.jpg',
            genre_ids: [18],
            id: 42,
            original_language: 'en',
            original_title: 'Original title',
            overview: 'A story.',
            popularity: 10,
            poster_path: '/poster.jpg',
            release_date: '2025-01-02',
            title: 'Un film',
            video: false,
            vote_average: 7.5,
            vote_count: 100,
          },
        ],
        total_pages: 4,
        total_results: 80,
      }),
    });

    const response = await request(
      port,
      '/api/movies/popular?language=en-US&page=2&region=US',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      page: 2,
      results: [
        {
          backdrop_path: '/backdrop.jpg',
          genre_ids: [18],
          id: 42,
          original_language: 'en',
          original_title: 'Original title',
          overview: 'A story.',
          popularity: 10,
          poster_path: '/poster.jpg',
          release_date: '2025-01-02',
          title: 'Un film',
          vote_average: 7.5,
          vote_count: 100,
        },
      ],
      total_pages: 4,
      total_results: 80,
    });
    expect(tmdbFetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular?language=en-US&page=2&region=US',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer integration-test-token',
        }),
      }),
    );
  });

  it('serves movie details for the requested movie ID', async () => {
    const details = {
      id: 42,
      title: 'Un film',
      genres: [{ id: 18, name: 'Drame' }],
    };
    tmdbFetch.mockResolvedValue({
      ok: true,
      json: async () => details,
    });

    const response = await request(port, '/api/movies/42?language=fr-CA');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(details);
    expect(tmdbFetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/42?language=fr-CA',
      expect.any(Object),
    );
  });

  it('returns a client error for an invalid movie ID without calling TMDB', async () => {
    const response = await request(port, '/api/movies/not-a-number');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid movie ID' });
    expect(tmdbFetch).not.toHaveBeenCalled();
  });

  it('returns not found when TMDB has no matching movie', async () => {
    tmdbFetch.mockResolvedValue({ ok: false, status: 404 });

    const response = await request(port, '/api/movies/404');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Movie not found' });
  });
});
