import type { TmdbMovieDetailsResponse } from '../../back-end/schemas/MoviesTypes';
import './MovieDetailCard.css';

type MovieDetailCardProps = {
  movie: TmdbMovieDetailsResponse;
};

export default function MovieDetailCard({ movie }: MovieDetailCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const releaseYear = movie.release_date.slice(0, 4) || '—';

  return (
    <article className="movie-detail-card">
      <div className="movie-detail-card__poster-wrap">
        {posterUrl ? (
          <img
            className="movie-detail-card__poster"
            src={posterUrl}
            alt={`Affiche de ${movie.title}`}
          />
        ) : (
          <div
            className="movie-detail-card__poster movie-detail-card__poster--fallback"
            role="img"
            aria-label={`Affiche indisponible pour ${movie.title}`}
          />
        )}
      </div>

      <div className="movie-detail-card__content">
        <p className="movie-detail-card__eyebrow">Détails du film</p>
        <h2 className="movie-detail-card__title">{movie.title}</h2>
        {movie.tagline && (
          <p className="movie-detail-card__tagline">{movie.tagline}</p>
        )}

        <div className="movie-detail-card__facts">
          <span>Année de sortie {releaseYear}</span>
          <span>Note {movie.vote_average.toFixed(1)}</span>
          <span>Film ID : {movie.id}</span>
        </div>

        {movie.genres.length > 0 && (
          <section
            className="movie-detail-card__section"
            aria-labelledby="movie-genres-heading"
          >
            <h3 id="movie-genres-heading">Genres</h3>
            <ul className="movie-detail-card__genres">
              {movie.genres.map((genre) => (
                <li key={genre.id}>{genre.name}</li>
              ))}
            </ul>
          </section>
        )}

        <section
          className="movie-detail-card__section"
          aria-labelledby="movie-overview-heading"
        >
          <h3 id="movie-overview-heading">Résumé</h3>
          <p className="movie-detail-card__overview">
            {movie.overview || 'Aucune description disponible pour ce film.'}
          </p>
        </section>
      </div>
    </article>
  );
}
