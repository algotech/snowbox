import { normalize } from 'normalizr';

import { actions } from './constants';

const methods = {
  [actions.UPSERT]: 'upsert',
  [actions.REMOVE]: 'remove',
  [actions.FIND]: 'fetch',
  [actions.FETCH]: 'fetch',
};

export const snowboxMiddleware = store => next => async action => {
  if (![
      actions.UPSERT,
      actions.REMOVE,
      actions.FIND,
      actions.FETCH,
    ].includes(action.type)
  ) {
    return next(action);
  }

  next(action);

  try {
    const method = methods[action.type];
    const entity = Array.isArray(action.entity) ?
      action.entity[0] :
      action.entity;

    const response = await entity.provider[method](action.data);

    if (method == 'remove') {
      return next(action.success(action.data));
    }

    const { entities, result } = normalize(response, action.entity);

    return next(action.success(action.data, entities, result));
  } catch (error) {
    return next(action.failure(action.data, error, error.status));
  }
};
