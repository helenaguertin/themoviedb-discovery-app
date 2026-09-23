import express from 'express';
import { tmdbAccessToken } from './config';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';
import {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from './schemas/MoviesTypes';
import { toSupportedMovie } from './utils';

// Create a new express application instance
const app = express();

// Define the port number for the server to listen on
const port: number = 3000;

// Define a route handler for the root URL ('/')
app.get('/', (_req: express.Request, res: express.Response) => {
  res.send('Hello World from TypeScript!');
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Example app in TypeScript listening on port ${port}`);
});

// Define a route handler for fetching popular movies from TMDB API
app.get(
  '/api/movies/popular',
  async (req: express.Request, res: express.Response) => {
    try {
      const tmdbUrl = new URL('https://api.themoviedb.org/3/movie/popular');

      const defaultParameters: Record<string, string> = {
        language: DEFAULT_LANGUAGE,
        page: DEFAULT_PAGE,
        region: DEFAULT_REGION,
      };

      for (const [parameter, defaultValue] of Object.entries(
        defaultParameters,
      )) {
        const value = req.query[parameter];

        tmdbUrl.searchParams.set(
          parameter,
          typeof value === 'string' ? value : defaultValue,
        );
      }

      const response = await fetch(tmdbUrl, {
        headers: {
          Authorization: `Bearer ${tmdbAccessToken}`,
          'Content-Type': 'application/json;charset=utf-8',
        },
      });

      if (!response.ok) {
        throw new Error(
          `TMDB API request failed with status ${response.status}`,
        );
      }

      // Parse the raw response from the TMDB API
      const rawData = (await response.json()) as TmdbMoviesRawResponse;

      // Transform the raw data into the supported format for our application
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
  },
);

// Define a route handler for health check endpoint
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  const response: { status: string } = { status: 'ok' };
  res.json(response);
});
