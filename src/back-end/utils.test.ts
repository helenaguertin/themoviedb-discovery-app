import { describe, expect, it } from 'vitest';
import { toSupportedMovie } from './utils';

describe('toSupportedMovie', () => {
  it('maps supported TMDB movie fields and omits adult and video', () => {
    const movie = {
      adult: true,
      backdrop_path: '/backdrop.jpg',
      genre_ids: [18, 35],
      id: 123,
      original_language: 'en',
      original_title: 'Original title',
      overview: 'A film overview.',
      popularity: 42.5,
      poster_path: '/poster.jpg',
      release_date: '2025-06-01',
      title: 'Localized title',
      video: true,
      vote_average: 8.2,
      vote_count: 500,
    };

    expect(toSupportedMovie(movie)).toEqual({
      backdrop_path: movie.backdrop_path,
      genre_ids: movie.genre_ids,
      id: movie.id,
      original_language: movie.original_language,
      original_title: movie.original_title,
      overview: movie.overview,
      popularity: movie.popularity,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      title: movie.title,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
    });
  });
});
