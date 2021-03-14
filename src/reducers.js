import { combineReducers } from 'redux';

import { success, failure } from './actions';
import { buildKey } from './utils';
import { actions, statuses } from './constants';

const entitiesReducer = (state = {}, action) => {
  if (action.type == success(actions.REMOVE)) {
    const newState = {
      ...state,
      [action.entity.key]: { ...state[action.entity.key] },
    };
    const id = typeof action.data == 'number' ?
      action.data :
      action.data[action.entity.idAttribute];
    delete newState[action.entity.key][id];

    return newState;
  }

  if (!action.entities) {
    return state;
  }

  const newState = { ...state };

  for (const entity in action.entities) {
    newState[entity] = {
      ...(newState[entity] || {}),
    };
    for (const id in action.entities[entity]) {
      newState[entity][id] = {
        ...((newState[entity] || {})[id] || {}),
        ...action.entities[entity][id],
        __updatedAt: action.date,
      };
    }
  }

  return newState;
};

const fetchEntityhMetaReducer = (state = {}, action) => {
  switch (action.type) {
    case actions.FETCH:
      return {
        progress: statuses.PENDING,
      };
    case success(actions.FETCH):
      return {
        progress: statuses.SUCCEEDED,
        result: action.result,
        __updatedAt: action.date,
      };
    case failure(actions.FETCH):
      return {
        progress: statuses.FAILED,
        error: action.error,
      };
  }
};

const entityMetaReducer = (state = {}, action) => {
  const key = buildKey(action.data);

  return {
    ...state,
    [key]: fetchEntityhMetaReducer(state[key], action),
  };
};

const metaReducer = (state = {}, action) => {
  const allowedActions = [
    actions.FETCH,
    success(actions.FETCH),
    failure(actions.FETCH),
  ];

  if (!allowedActions.includes(action.type)) {
    return state;
  }

  const entity = Array.isArray(action.entity) ?
    action.entity[0] :
    action.entity;

  return {
    ...state,
    [entity.key]: entityMetaReducer(state[entity.key], action),
  };
}

export const rootReducer = combineReducers({
  entities: entitiesReducer,
  meta: metaReducer,
});

export const snowboxReducer = (state, action) => {
  if (action.type == actions.CLEAR) {
    return rootReducer(undefined, action);
  }

  return rootReducer(state, action);
};
