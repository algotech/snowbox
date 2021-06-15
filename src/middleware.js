import { normalize } from 'normalizr';

import { noFetch } from './actions';
import { actions } from './constants';
import {
  selectCollections,
  selectEntities,
  selectSingletons,
} from './selectors';
import { buildKey } from './utils';

const methods = {
  [actions.UPSERT]: 'upsert',
  [actions.REMOVE]: 'remove',
  [actions.FIND]: 'find',
  [actions.FETCH]: 'fetch',
};

const getEntityFromAction = action => Array.isArray(action.entity) ?
  action.entity[0] :
  action.entity;

const getRequestMethodFromAction = action => methods[action.type];

export const selectExistingData = (store, action) => {
  const entity = getEntityFromAction(action);

  if (Array.isArray(action.entity)) {
    const key = buildKey(action.payload);
    const state = action?.meta?.isListHook ?
      store.getState() :
      selectCollections(store.getState())?.[entity.key];

    return state?.[key];
  }

  if (entity.singleton) {
    const state = selectSingletons(store.getState());

    return state?.[entity.key];
  }

  const state = selectEntities(store.getState());
  const id = action.payload[entity.idAttribute];

  return state?.[entity.key]?.[id];
};

export const dataAlreadyExists = (store, action) => {
  const method = getRequestMethodFromAction(action);
  const entity = getEntityFromAction(action);

  if (!['find', 'fetch'].includes(method)) {
    return false;
  }

  if (!entity.staleTimeout) {
    return false;
  }

  if (action?.meta?.refresh) {
    return false;
  }

  let state = selectExistingData(store, action);

  if (!state?.__updatedAt) {
    return false;
  }

  return Date.now() - state.__updatedAt < entity.staleTimeout;
};

export const getEntitiesData = (method, entity, response) => {
  if (method === 'fetch' && entity.fetchEntitiesPath) {
    return response[entity.fetchEntitiesPath];
  }

  if (entity.entitiesPath) {
    return response[entity.entitiesPath];
  }

  return response;
};

export const getResponseMetaData = (method, entity, response) => {
  if (method !== 'fetch') {
    return;
  }

  if (!entity.fetchEntitiesPath && !entity.entitiesPath) {
    return;
  }

  const meta = { ...response };

  if (entity.fetchEntitiesPath) {
    delete meta[entity.fetchEntitiesPath];
  } else if (entity.entitiesPath) {
    delete meta[entity.entitiesPath];
  }

  return meta;
};

const isHandledAction = action => [
  actions.UPSERT,
  actions.REMOVE,
  actions.FIND,
  actions.FETCH,
].includes(action.type);

const requestData = action => {
  const method = getRequestMethodFromAction(action);
  const entity = getEntityFromAction(action);

  return entity.provider[method](action.payload);
};

const getSuccessActionParams = (action, response) => {
  const method = getRequestMethodFromAction(action);

  if (method === 'remove') {
    return [action.payload];
  }

  const entity = getEntityFromAction(action);

  if (entity.singleton) {
    return [action.payload, undefined, response, undefined, Date.now()];
  }

  const responseMeta = getResponseMetaData(method, entity, response);

  if (action?.meta?.isListHook) {
    return [
      action.payload,
      undefined,
      response?.[entity.fetchEntitiesPath || entity.entitiesPath],
      responseMeta,
      Date.now(),
    ];
  }

  const entitiesData = getEntitiesData(method, entity, response);
  const { entities, result } = normalize(entitiesData, action.entity);

  return [action.payload, entities, result, responseMeta, Date.now()];
};

export const snowboxMiddleware = store => next => async action => {
  if (!isHandledAction(action)) {
    return next(action);
  }

  if (dataAlreadyExists(store, action)) {
    return next(noFetch());
  }

  if (!action?.meta?.isListHook) {
    next(action);
  }

  try {
    const response = await requestData(action);

    const actionParams = getSuccessActionParams(action, response);

    return next(action.success(...actionParams));
  } catch (error) {
    return next(action.failure(action.payload, error, error.status));
  }
};
