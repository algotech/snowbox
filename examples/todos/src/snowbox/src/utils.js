const baseKey = '#';

export const buildKey = (filters = {}) => {
  if (!filters || typeof filters != 'object' || Array.isArray(filters)) {
    return baseKey;
  }

  return Object.keys(filters)
    .sort()
    .reduce((key, filter) => {
      key += `${filter}[${filters[filter]}]`;

      return key;
    }, baseKey);
}
