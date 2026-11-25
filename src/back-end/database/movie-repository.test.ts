// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema.ts';
import {
  findMovieById,
  listMovies,
  upsertMovies,
  type MovieRecord,
} from './movie-repository.ts';

function createMovie(overrides: Partial<MovieRecord> = {}): MovieRecord {
  return {
    id: 1,
    title: 'Movie',
    original_title: 'Original Movie',
    original_language: 'en',
    overview: 'A movie overview',
    release_date: '2020-01-01',
    popularity: 12.5,
    vote_average: 7.5,
    vote_count: 100,
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    runtime_minutes: 120,
    budget: 1000000,
    revenue: 2000000,
    collected_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('movie-repository.ts', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('finds movies by id and lists them sorted by id', () => {
    // Arrange
    expect(listMovies(database)).toEqual([]);
    upsertMovies(database, [
      createMovie({ id: 42, title: 'Forty-two' }),
      createMovie({ id: 7, title: 'Seven' }),
    ]);

    // Act
    const present = findMovieById(database, 42);
    const absent = findMovieById(database, 99);
    const movies = listMovies(database);

    // Assert
    expect(present).toEqual(createMovie({ id: 42, title: 'Forty-two' }));
    expect(absent).toBeUndefined();
    expect(movies.map((movie) => movie.id)).toEqual([7, 42]);
  });

  it('inserts, updates, and deduplicates movie records', () => {
    // Arrange
    const inserted = upsertMovies(database, [
      createMovie({ id: 1, title: 'First version' }),
      createMovie({ id: 1, title: 'Latest version' }),
      createMovie({ id: 2, title: 'Another movie' }),
    ]);

    // Act
    const updated = upsertMovies(database, [
      createMovie({
        id: 1,
        title: 'Updated movie',
        collected_at: '2025-02-01T00:00:00.000Z',
      }),
    ]);
    const unchanged = upsertMovies(database, []);

    // Assert
    expect(inserted).toBe(2);
    expect(updated).toBe(1);
    expect(unchanged).toBe(0);
    expect(findMovieById(database, 1)).toEqual(
      createMovie({
        id: 1,
        title: 'Updated movie',
        collected_at: '2025-02-01T00:00:00.000Z',
      }),
    );
    expect(findMovieById(database, 2)?.title).toBe('Another movie');
  });

  it('rolls back the batch when a movie violates the schema', () => {
    // Arrange
    const invalidBatch = [createMovie({ id: 2 }), createMovie({ id: 0 })];

    // Act and Assert
    expect(() => upsertMovies(database, invalidBatch)).toThrow(
      /CHECK constraint failed/,
    );
    expect(listMovies(database)).toEqual([]);
  });
});
