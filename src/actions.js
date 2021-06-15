import { actions } from './constants';

const SUCCESS_EXTENSION = '_SUCCESS';
const FAILURE_EXTENSION = '_FAILURE';

export const isSuccess = type => {
  const regExp = new RegExp(`${SUCCESS_EXTENSION}$`);

  return regExp.test(type);
};

export const isFailure = type => {
  const regExp = new RegExp(`${FAILURE_EXTENSION}$`);

  return regExp.test(type);
};

export const success = str => `${str}${SUCCESS_EXTENSION}`;

export const failure = str => `${str}${FAILURE_EXTENSION}`;

export const createAction = type => (payload = {}) => ({ type, ...payload });

export const succeeded = type => createAction(success(type));

export const failed = type => createAction(failure(type));

export const createSuccess = type => entity => (
  payload,
  entities,
  result,
  meta,
  date
) => ({
  type: success(type), entity, payload, entities, result, meta, date
});

export const createFailure = type => entity => (payload, error, statusCode) => ({
  type: failure(type), entity, payload, error, statusCode
});

export const request = type => entity => (payload, meta = {}) => ({
  type,
  entity,
  payload,
  meta,
  success: createSuccess(type)(entity),
  failure: createFailure(type)(entity),
});

export const upsert = request(actions.UPSERT);

export const remove = request(actions.REMOVE);

export const find = request(actions.FIND);

export const fetch = request(actions.FETCH);

export const clearAll = createAction(actions.CLEAR);

export const noFetch = createAction(actions.NO_FETCH);
