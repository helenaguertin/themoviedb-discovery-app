// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import type { Movie } from '../../back-end/schemas/MoviesTypes';
import MoviesListPage from './MoviesListPage';

const movie: Movie = {
  backdrop_path: '/backdrop.jpg',
  genre_ids: [18],
  id: 42,
  original_language: 'en',
  original_title: 'A Movie',
  overview: 'A story.',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  release_date: '2025-01-02',
  title: 'Un film',
  vote_average: 7.5,
  vote_count: 100,
};

describe('MoviesListPage', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/movies');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads and renders popular movies with a detail link', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ results: [movie] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <MoviesListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Un film' }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/movies/popular?language=fr-FR&page=1&region=FR',
    );
    expect(
      screen.getByRole('link', { name: /Un film/ }).getAttribute('href'),
    ).toBe('/movies/42');
  });

  it('renders an empty list when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    render(
      <MemoryRouter>
        <MoviesListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Films populaires' }),
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Un film' })).toBeNull();
  });
});
