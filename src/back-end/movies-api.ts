import type { Express, Request, Response } from 'express';
import { tmdbAccessToken } from './config';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';
import type {
  MoviesApiResponse,
  TmdbMovieDetailsResponse,
  TmdbMoviesRawResponse,
} from './schemas/MoviesTypes';
import { toSupportedMovie } from './utils';

export function registerMoviesApi(app: Express): void {
  app.get('/api/movies/popular', async (_req: Request, res: Response) => {
    try {
      const queryParams = new URLSearchParams();
      const { language, page, region } = _req.query;

      queryParams.append('language', (language as string) || DEFAULT_LANGUAGE);
      queryParams.append('page', (page as string) || DEFAULT_PAGE);
      queryParams.append('region', (region as string) || DEFAULT_REGION);

      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${tmdbAccessToken}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `TMDB API request failed with status ${response.status}`,
        );
      }

      const rawData = (await response.json()) as TmdbMoviesRawResponse;
      const data: MoviesApiResponse = {
        page: rawData.page,
        results: rawData.results.map(toSupportedMovie),
        total_pages: rawData.total_pages,
        total_results: rawData.total_results,
      };

      res.json(data);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
  });

  app.get('/api/movies/:id', async (_req: Request, res: Response) => {
    const movieId = _req.params.id;
    const numericMovieId = Number(movieId);

    if (!Number.isSafeInteger(numericMovieId) || numericMovieId <= 0) {
      res.status(400).json({ error: 'Invalid movie ID' });
      return;
    }

    try {
      const language = (_req.query.language as string) || DEFAULT_LANGUAGE;
      const queryParams = new URLSearchParams({ language });
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${numericMovieId}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${tmdbAccessToken}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        },
      );

      if (response.status === 404) {
        res.status(404).json({ error: 'Movie not found' });
        return;
      }

      if (!response.ok) {
        throw new Error(
          `TMDB API request failed with status ${response.status}`,
        );
      }

      const movieDetails = (await response.json()) as TmdbMovieDetailsResponse;
      res.json(movieDetails);
    } catch (error) {
      console.error(`Error fetching movie ${numericMovieId}:`, error);
      res.status(500).json({ error: 'Failed to fetch movie details' });
    }
  });
}
