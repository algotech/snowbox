import _ from 'lodash';

import { contentTypes } from './constants';
import Response from './Response';

const provider = (api) => (providedOptions = {}) => {
  if (typeof providedOptions.particle !== 'string' ||
    providedOptions.particle === ''
  ) {
    throw new Error('"particle" must be a nonempty string');
  }

  const options = {
    idField: 'id',

    // Response
    entityPath: 'data',
    entitiesPath: 'data',
    entitiesFieldName: 'records',
    hasMeta: true,
    metaPath: '',
    metaFieldName: 'meta',

    // Find
    findPath: (filter, { particle, idField }) => (
      `/${particle}/${typeof filter === 'object' ? filter[idField] : filter}`
    ),
    findParams: (filter, { idField }) => _.omit(filter, idField),

    // Fetch
    fetchPath: (filter, { particle }) => `/${options.particle}`,
    fetchParams: (filter, { idField }) => _.omit(filter, idField),

    // Upsert
    createMethod: 'post',
    updateMethod: 'put',
    upsertContentType: contentTypes.JSON,
    upsertPath: (data, { particle, idField }) => (
      `/${particle}${data[idField] ? '/' : ''}${_.get(data, idField, '')}`
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

  const find = async (filter) => {
    const response = await api.get(
      options.findPath(filter, options),
      options.findParams(filter, options)
    );

    return new Response(response, options);
  };

  const fetch = async (filter) => {
    const response = await api.get(
      options.fetchPath(filter, options),
      options.fetchParams(filter, options)
    );

    return new Response(response, options, true);
  };

  const upsert = async (data, params) => {
    const method = options.upsertMethod(data, options);

    const response = await api[method](
      options.upsertPath(data, options),
      data,
      params,
      options.upsertContentType
    );

    return new Response(response, options);
  };

  const remove = async (data) => {
    const response = await api[options.removeMethod](
      options.removePath(data, options)
    );

    return new Response(response, options);
  };

  return {
    find,
    fetch,
    upsert,
    remove,
  };
};

export default provider;
