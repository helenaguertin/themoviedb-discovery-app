import { expect, test } from '@playwright/test';

const popularMovies = {
  page: 1,
  results: [
    {
      backdrop_path: '/resident-evil-backdrop.jpg',
      genre_ids: [27, 878],
      id: 1273221,
      original_language: 'en',
      original_title: 'Resident Evil',
      overview: 'A courier fights to survive a horrifying night.',
      popularity: 100,
      poster_path: '/resident-evil-poster.jpg',
      release_date: '2026-09-18',
      title: 'Resident Evil',
      vote_average: 7.3,
      vote_count: 125,
    },
  ],
  total_pages: 1,
  total_results: 1,
};

const movieDetails = {
  adult: false,
  backdrop_path: '/resident-evil-backdrop.jpg',
  belongs_to_collection: null,
  budget: 1000000,
  genres: [
    { id: 27, name: 'Horror' },
    { id: 878, name: 'Science Fiction' },
  ],
  homepage: null,
  id: 1273221,
  imdb_id: 'tt1273221',
  origin_country: ['US'],
  original_language: 'en',
  original_title: 'Resident Evil',
  overview: 'A courier fights to survive a horrifying night.',
  popularity: 100,
  poster_path: '/resident-evil-poster.jpg',
  production_companies: [],
  production_countries: [],
  release_date: '2026-09-18',
  revenue: 0,
  runtime: 100,
  spoken_languages: [],
  status: 'Released',
  tagline: 'A new era of evil.',
  title: 'Resident Evil',
  video: false,
  vote_average: 7.3,
  vote_count: 125,
};

test('user can browse popular movies, open a detail page, and visit About', async ({
  page,
}) => {
  await page.route('**/api/movies/popular?**', (route) =>
    route.fulfill({ json: popularMovies }),
  );
  await page.route('**/api/movies/1273221?**', (route) =>
    route.fulfill({ json: movieDetails }),
  );

  await page.goto('/');
  await expect(page).toHaveURL(/\/movies$/);
  await expect(
    page.getByRole('heading', { name: 'Films populaires' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Resident Evil/ })).toBeVisible();

  await page.getByRole('link', { name: /Resident Evil/ }).click();
  await expect(page).toHaveURL(/\/movies\/1273221$/);
  await expect(
    page.getByRole('heading', { name: 'Détails du film' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Resident Evil' }),
  ).toBeVisible();
  await expect(page.getByText('A new era of evil.')).toBeVisible();
  await expect(page.getByText('Science Fiction')).toBeVisible();

  await page.getByRole('link', { name: 'À propos' }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole('heading', { name: 'À propos de l’application' }),
  ).toBeVisible();
});

test('unknown URLs show the not-found page', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');

  await expect(
    page.getByRole('heading', { name: 'Page introuvable' }),
  ).toBeVisible();
});
