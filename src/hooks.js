import { useState, useEffect, useReducer } from 'react';
import { combineReducers } from 'redux';

import * as actions from './actions';
import { statuses } from './constants';
import { snowboxMiddleware } from './middleware';
import { entityCollectionsReducer } from './reducers';
import { buildKey } from './utils';

export const useList = (entity, initialFilters = {}) => {
  const [filters, setCurrFilters] = useState(initialFilters);
  const [prevFilters, setPrevFilters] = useState(null);
  const [state, dispatch] = useReducer(entityCollectionsReducer, {});
  const middleware = snowboxMiddleware({ getState: () => state });

  useEffect(() => {
    fetchList();
  }, [entity, filters]);

  const setFilters = (newFilters) => {
    setPrevFilters(filters);
    setCurrFilters(newFilters);
  };

  const fetchList = refresh => {
    middleware(dispatch)(actions.fetch([entity])(filters, {
      isListHook: true,
      refresh,
    }));
  };

  const write = (payload, actionCreator) => new Promise((resolve, reject) => {
    const nextOnWrite = action => {
      if (actions.isSuccess(action.type)) {
        resolve(action.result);
        fetchList(true);
      }
      if (actions.isFailure(action.type)) {
        reject(action.error);
      }
    };

    middleware(nextOnWrite)(actionCreator(entity)(
      payload, { isListHook: true }
    ));
  });

  const upsert = payload => write(payload, actions.upsert);
  const remove = payload => write(payload, actions.remove);

  const key = buildKey(filters);
  const prevKey = buildKey(prevFilters);

  return {
    items: state[key]?.result || [],
    meta: state[key]?.meta || {},
    status: state[key]?.status || statuses.PENDING,
    error: state[key]?.error,
    prevItems: state[prevKey]?.result,
    prevMeta: state[prevKey]?.meta,
    setFilters,
    upsert,
    remove,
  };
};
