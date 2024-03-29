import { entity } from '../src/entity';
import providerCreator from '../src/provider';

describe('entity', () => {
  it('creates a normalizr entity', () => {
    expect(entity('key').constructor.name).toBe('EntitySchema');
  });

  it('sets the provider', () => {
    const provider = providerCreator({})({ particle: 'p' });

    expect(entity('key', provider).provider).toStrictEqual(provider);
  });

  it('throws and error when the provider is not valid', () => {
    expect(() => entity('k', 'invalid')).toThrow();
  });

  it('sets the schema relations', () => {
    expect(entity('k', null, { a: 'a' }).schema).toStrictEqual({ a: 'a' });
  });

  it('sets the stale timeout', () => {
    expect(entity('k', null, {}, { staleTimeout: 13 }).staleTimeout)
      .toEqual(13);
  });
});
