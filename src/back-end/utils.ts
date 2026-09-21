import type { TmdbMoviesRawResponse, Movie } from './schemas/MoviesTypes';

/**
 * Transforms a TmdbMovie object into a supported Movie object by omitting the 'adult' and 'video' properties.
 * @param movie The raw TmdbMovie object.
 * @returns The supported Movie object.
 */
export const toSupportedMovie = (
  movieTMDB: TmdbMoviesRawResponse['results'][number],
): Movie => {
  return {
    backdrop_path: movieTMDB.backdrop_path,
    genre_ids: movieTMDB.genre_ids,
    id: movieTMDB.id,
    original_language: movieTMDB.original_language,
    original_title: movieTMDB.original_title,
    overview: movieTMDB.overview,
    popularity: movieTMDB.popularity,
    poster_path: movieTMDB.poster_path,
    release_date: movieTMDB.release_date,
    title: movieTMDB.title,
    vote_average: movieTMDB.vote_average,
    vote_count: movieTMDB.vote_count,
  };
};
