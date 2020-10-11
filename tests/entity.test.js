import { entity } from '../src/entity';
import Provider from '../src/provider';

describe('entity', () => {
  it('creates a normalizr entity', () => {
    expect(entity('key').constructor.name).toBe('EntitySchema');
  });

  it('sets the provider', () => {
    const provider = new Provider('p');

    expect(entity('key', provider).provider).toStrictEqual(provider);
  });

  it('throws and error when the provider is not valid', () => {
    expect(() => entity('k', 'invalid')).toThrow();
  });

  it('sets the schema relations', () => {
    expect(entity('k', null, { a: 'a' }).schema).toStrictEqual({ a: 'a' });
  });

  it('attaches extra fields', () => {
    expect(entity('k', undefined, undefined, { a: 1, b: 2 })).toStrictEqual(
      expect.objectContaining({ a: 1, b: 2 })
    );
  });
});
