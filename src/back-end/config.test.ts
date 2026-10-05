import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
}));

describe('TMDB configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.TMDB_ACCESS_TOKEN;
  });

  afterEach(() => {
    delete process.env.TMDB_ACCESS_TOKEN;
  });

  it('exports the access token from the environment', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-token';

    const { tmdbAccessToken } = await import('./config');

    expect(tmdbAccessToken).toBe('test-token');
  });

  it('throws when the access token is not configured', async () => {
    await expect(import('./config')).rejects.toThrow(
      'TMDB_ACCESS_TOKEN is not defined in the environment variables.',
    );
  });
});
