import { actions } from './constants';

export const success = str => `${str}_SUCCESS`;

export const failure = str => `${str}_FAILURE`;

export const createAction = type => (data = {}) => ({ type, ...data });

export const succeeded = type => createAction(success(type));

export const failed = type => createAction(failure(type));

export const createSuccess = type => entity => (
  data,
  entities,
  result,
  date
) => ({
  type: success(type), entity, data, entities, result, date
});

export const createFailure = type => entity => (data, error, statusCode) => ({
  type: failure(type), entity, data, error, statusCode
});

export const request = type => entity => (data, options = {}) => ({
  type,
  entity,
  data,
  options,
  success: createSuccess(type)(entity),
  failure: createFailure(type)(entity),
});

export const upsert = request(actions.UPSERT);

export const remove = request(actions.REMOVE);

export const find = request(actions.FIND);

export const fetch = request(actions.FETCH);

export const clearAll = createAction(actions.CLEAR);

export const noFetch = createAction(actions.NO_FETCH);
