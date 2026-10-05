import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { DEFAULT_LANGUAGE } from '../../back-end/constants';
import type { TmdbMovieDetailsResponse } from '../../back-end/schemas/MoviesTypes';
import MovieDetailCard from '../components/MovieDetailCard';

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

  return (
    <main className="page-shell detail-page">
      <h1 className="detail-page__title">Détails du film</h1>
      <div className="detail-header">
        <Link to="/" className="back-link">
          ← Retour vers les films populaires
        </Link>
      </div>
      <MovieDetailCard movie={movie} />
    </main>
  );
}
