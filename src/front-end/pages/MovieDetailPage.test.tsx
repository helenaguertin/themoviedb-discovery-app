// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { TmdbMovieDetailsResponse } from '../../back-end/schemas/MoviesTypes';
import MovieDetailPage from './MovieDetailPage';

const movieDetails: TmdbMovieDetailsResponse = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  belongs_to_collection: null,
  budget: 1000000,
  genres: [{ id: 18, name: 'Drame' }],
  homepage: null,
  id: 42,
  imdb_id: 'tt0000042',
  origin_country: ['FR'],
  original_language: 'fr',
  original_title: 'Un film',
  overview: 'Une histoire à découvrir.',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  production_companies: [],
  production_countries: [],
  release_date: '2025-01-02',
  revenue: 5000000,
  runtime: 110,
  spoken_languages: [],
  status: 'Released',
  tagline: 'Une histoire.',
  title: 'Un film',
  video: false,
  vote_average: 7.5,
  vote_count: 100,
};

function renderDetailPage() {
  return render(
    <MemoryRouter initialEntries={['/movies/42']}>
      <Routes>
        <Route path="/movies/:id" element={<MovieDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MovieDetailPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('fetches the route movie and renders its details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(movieDetails),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderDetailPage();

    expect(
      await screen.findByRole('heading', { name: 'Un film' }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/movies/42?language=fr-FR');
    expect(screen.getByText('Film ID : 42')).toBeTruthy();
    expect(screen.getByText('Drame')).toBeTruthy();
    expect(screen.getByText('Une histoire à découvrir.')).toBeTruthy();
  });

  it('renders an error message when the detail request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    renderDetailPage();

    expect(
      await screen.findByRole('heading', { name: 'Page indisponible' }),
    ).toBeTruthy();
    expect(screen.getByText('Unable to load this movie.')).toBeTruthy();
  });
});
