import { useEffect, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../../back-end/constants';
import type { Movie } from '../../back-end/schemas/MoviesTypes';
import MovieItem from '../components/MovieItem';

export default function MoviesListPage() {
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const language = queryParams.get('language') || DEFAULT_LANGUAGE;
  const page = queryParams.get('page') || DEFAULT_PAGE;
  const region = queryParams.get('region') || DEFAULT_REGION;

  useEffect(() => {
    const requestParams = new URLSearchParams({ language, page, region });

    fetch(`/api/movies/popular?${requestParams.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        setMovies(data.results);
      })
      .catch(() => {
        setMovies([]);
      });
  }, [language, page, region]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Films populaires</h1>
        <h2>
          Films tendances en France, d'après les données de{' '}
          <b>The Movie Database</b>
        </h2>
      </header>
      <section>
        {movies ? (
          <ul className="movie-grid">
            {movies.map((movie) => (
              <li key={movie.id}>
                <MovieItem movie={movie} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="status-message">Loading...</p>
        )}
      </section>
    </main>
  );
}
