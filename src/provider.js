import { contentTypes } from './constants';

const removeObjectField = (obj, field) => {
  if (typeof obj !== 'object') {
    return undefined;
  }

  const newObj = { ...obj };
  delete newObj[field];

  return newObj;
};

const objGet = (object, field, defaultVal) => (
  typeof object[field] === 'undefined' ? defaultVal : object[field]
);

const provider = (api) => (providedOptions = {}) => {
  if (typeof providedOptions.particle != 'string' ||
    providedOptions.particle === ''
  ) {
    throw new Error('"particle" must be a nonempty string');
  }

  const options = {
    idField: 'id',
    // Find
    findPath: (filter, { particle, idField }) => (
      `/${particle}/${typeof filter === 'object' ? filter[idField] : filter}`
    ),
    findParams: (filter, { idField }) => removeObjectField(filter, idField),
    // Fetch
    fetchPath: (filter, { particle }) => `/${options.particle}`,
    fetchParams: (filter, { idField }) => removeObjectField(filter, idField),
    // Upsert
    createMethod: 'post',
    updateMethod: 'put',
    upsertContentType: contentTypes.JSON,
    upsertPath: (data, { particle, idField }) => (
      `/${particle}${data[idField] ? '/' : ''}${objGet(data, idField, '')}`
    ),
    upsertMethod: (data, { idField, createMethod, updateMethod }) => (
      data[idField] ? updateMethod : createMethod
    ),
    // Remove
    removeMethod: 'remove',
    removePath: (data, { particle, idField } = {}) => (
      `/${particle}/${typeof data === 'number' ? data : data[idField]}`
    ),

    ...providedOptions,
  };

  const find = (filter) => api.get(
    options.findPath(filter, options),
    options.findParams(filter, options)
  );

  const fetch = (filter) => api.get(
    options.fetchPath(filter, options),
    options.fetchParams(filter, options)
  );

  const upsert = (data, params) => {
    const method = options.upsertMethod(data, options);

    return api[method](
      options.upsertPath(data, options),
      data,
      params,
      options.upsertContentType
    );
  };

  const remove = (data) => api[options.removeMethod](
    options.removePath(data, options)
  );

  return {
    find,
    fetch,
    upsert,
    remove,
  };
};

export default provider;
