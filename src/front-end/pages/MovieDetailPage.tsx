import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { DEFAULT_LANGUAGE } from '../../back-end/constants';
import type { TmdbMovieDetailsResponse } from '../../back-end/schemas/MoviesTypes';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<TmdbMovieDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetch(`/api/movies/${id}?language=${DEFAULT_LANGUAGE}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Movie not found');
        }
        return response.json();
      })
      .then((data) => {
        setMovie(data);
      })
      .catch(() => {
        setError('Unable to load this movie.');
      });
  }, [id]);

  if (error) {
    return (
      <main className="page-shell detail-page">
        <div className="detail-header">
          <Link to="/" className="back-link">
            ← Retour à la liste
          </Link>
        </div>
        <section className="detail-card">
          <h1>Page indisponible</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!movie) {
    return (
      <main className="page-shell detail-page">
        <p className="status-message">Loading movie details...</p>
      </main>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <main className="page-shell detail-page">
      <div className="detail-header">
        <Link to="/" className="back-link">
          ← Retour à la liste
        </Link>
      </div>

      <article className="detail-card">
        <div className="detail-poster-wrap">
          {posterUrl ? (
            <img
              className="detail-poster"
              src={posterUrl}
              alt={`Affiche de ${movie.title}`}
            />
          ) : (
            <div className="detail-poster detail-poster--fallback" />
          )}
        </div>

        <div className="detail-content">
          <p className="detail-tag">Détail du film</p>
          <h1>{movie.title}</h1>
          <p className="detail-meta">Film ID : {id}</p>
          <p className="detail-meta">
            {movie.release_date.slice(0, 4)} • Note{' '}
            {movie.vote_average.toFixed(1)}
          </p>
          <p className="detail-overview">
            {movie.overview || 'Aucune description disponible pour ce film.'}
          </p>
        </div>
      </article>
    </main>
  );
}
