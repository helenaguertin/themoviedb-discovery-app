import type { Express, Request, Response } from 'express';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { tmdbAccessToken } from '../utils/config';
import type {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';
import { toSupportedMovie } from '../utils/converter';

function getStringQueryValue(
  query: Request['query'],
  key: string,
  defaultValue: string,
): string {
  const value = query[key];
  return typeof value === 'string' && value.length > 0 ? value : defaultValue;
}

/**
 * Registers the TMDB movie discovery route.
 */
export function registerDiscoverApi(app: Express): void {
  app.get(
    '/api/discover/movies',
    async (req: Request, res: Response): Promise<void> => {
      const { year } = req.query;
      if (
        typeof year !== 'string' ||
        !/^\d{4}$/.test(year) ||
        Number(year) < 1000
      ) {
        res.status(400).json({
          error: 'year must be a four-digit year between 1000 and 9999',
        });
        return;
      }

      const queryParams = new URLSearchParams({
        primary_release_year: year,
        language: getStringQueryValue(req.query, 'language', DEFAULT_LANGUAGE),
        page: getStringQueryValue(req.query, 'page', String(DEFAULT_PAGE)),
        region: getStringQueryValue(req.query, 'region', DEFAULT_REGION),
      });

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`,
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
        console.error('Error discovering movies:', error);
        res.status(500).json({ error: 'Failed to discover movies' });
      }
    },
  );
}
