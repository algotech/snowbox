import { combineReducers } from 'redux';
import produce from 'immer';

import { success, failure } from './actions';
import { buildKey } from './utils';
import { actions, statuses } from './constants';

const snowboxActions = [
  actions.FETCH, success(actions.FETCH), failure(actions.FETCH),
  actions.FIND, success(actions.FIND), failure(actions.FIND),
  actions.UPSERT, success(actions.UPSERT), failure(actions.UPSERT),
  actions.REMOVE, success(actions.REMOVE), failure(actions.REMOVE),
];

const entitiesReducer = (state = {}, action) => {
  if (!snowboxActions.includes(action.type)) {
    return state;
  }

  if (action?.entity?.singleton) {
    return state;
  }

  if (action.type === success(actions.REMOVE)) {
    const id = typeof action.payload === 'number' ?
      action.payload :
      action.payload[action.entity.idField];

    return produce(state, draftState => {
      delete draftState[action.entity.key][id];
    });
  }

  if (!action.entities) {
    return state;
  }

  return produce(state, draftState => {
    for (const entity in action.entities) {
      draftState[entity] = draftState[entity] || {};

      for (const id in action.entities[entity]) {
        draftState[entity][id] = {
          ...draftState[entity][id],
          ...action.entities[entity][id],
          __updatedAt: action.date,
        };
      }
    }
  });
};

const fetchEntityCollectionsReducer = (state = {}, action) => {
  switch (action.type) {
    case actions.FETCH:
      return {
        status: statuses.PENDING,
      };
    case success(actions.FETCH):
      return {
        status: statuses.SUCCEEDED,
        result: action.result,
        meta: action.meta,
        __updatedAt: action.date,
      };
    case failure(actions.FETCH):
      return {
        status: statuses.FAILED,
        error: action.error,
      };
    default:
      return state;
  }
};

export const entityCollectionsReducer = (state = {}, action) => {
  const key = buildKey(action.payload);

  return produce(state, draftState => {
    draftState[key] = fetchEntityCollectionsReducer(state[key], action);
  });
};

const collectionsReducer = (state = {}, action) => {
  const allowedActions = [
    actions.FETCH,
    success(actions.FETCH),
    failure(actions.FETCH),
  ];

  if (!allowedActions.includes(action.type)) {
    return state;
  }

  if (!Array.isArray(action.entity)) {
    return state;
  }

  const entity = action.entity[0];

  return produce(state, draftState => {
    draftState[entity.key] = entityCollectionsReducer(
      state[entity.key],
      action
    );
  });
};

const singletonsReducer = (state = {}, action) => {
  if (!snowboxActions.includes(action.type)) {
    return state;
  }

  if (!action?.entity?.singleton) {
    return state;
  }

  if (action.type === success(actions.REMOVE)) {
    return produce(state, draftState => {
      delete draftState[action.entity.key];
    });
  }

  return produce(state, draftState => {
    draftState[action.entity.key] = {
      ...action.result,
      __updatedAt: action.date,
    };
  });
};

export const rootReducer = combineReducers({
  entities: entitiesReducer,
  collections: collectionsReducer,
  singletons: singletonsReducer,
});

export const snowboxReducer = (state, action) => {
  if (action.type === actions.CLEAR) {
    return rootReducer(undefined, action);
  }

  return rootReducer(state, action);
};
