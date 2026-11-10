import type { Express, Request, RequestHandler, Response } from 'express';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { tmdbAccessToken } from '../utils/config';
import { toSupportedMovie } from '../utils/converter';
import type {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

const INVALID_YEAR_MESSAGE =
  'year must be a four-digit year between 1000 and 9999';

function getStringQueryValue(
  value: Request['query'][string],
  defaultValue: string,
): string {
  return typeof value === 'string' && value.length > 0 ? value : defaultValue;
}

function createDiscoverQueryParams(
  query: Request['query'],
  year: string,
): URLSearchParams {
  const queryParams = new URLSearchParams();
  queryParams.set('primary_release_year', year);
  queryParams.set(
    'language',
    getStringQueryValue(query.language, DEFAULT_LANGUAGE),
  );
  queryParams.set(
    'page',
    getStringQueryValue(query.page, String(DEFAULT_PAGE)),
  );
  queryParams.set('region', getStringQueryValue(query.region, DEFAULT_REGION));
  return queryParams;
}

function createDiscoverMoviesHandler(): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const year = req.query.year;
    if (
      typeof year !== 'string' ||
      !/^\d{4}$/.test(year) ||
      Number(year) < 1000
    ) {
      res.status(400).json({ error: INVALID_YEAR_MESSAGE });
      return;
    }

    const queryParams = createDiscoverQueryParams(req.query, year);

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
  };
}

export function registerDiscoverApi(app: Express): void {
  app.get('/api/discover/movies', createDiscoverMoviesHandler());
}
