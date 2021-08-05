import { useState, useEffect, useReducer, useMemo } from 'react';

import * as actions from './actions';
import { statuses } from './constants';
import { snowboxMiddleware } from './middleware';
import { entityCollectionsReducer } from './reducers';
import { buildKey } from './utils';

const fetchList = (middleware, dispatch, entity, filters, refresh) => {
  middleware(dispatch)(actions.fetch([entity])(filters, {
    isListHook: true,
    refresh,
  }));
};

export const useList = (entity, initialFilters = {}) => {
  const [filters, setCurrFilters] = useState(initialFilters);
  const [prevFilters, setPrevFilters] = useState(null);
  const [state, dispatch] = useReducer(entityCollectionsReducer, {});
  const middleware = useMemo(
    () => snowboxMiddleware({ getState: () => state }),
    [state]
  );

  useEffect(() => {
    fetchList(middleware, dispatch, entity, filters);
  }, []);

  const write = (payload, actionCreator) => new Promise((resolve, reject) => {
    const nextOnWrite = action => {
      if (actions.isSuccess(action.type)) {
        resolve(action.result);
        fetchList(middleware, dispatch, entity, filters, true);
      }
      if (actions.isFailure(action.type)) {
        reject(action.error);
      }
    };

    middleware(nextOnWrite)(actionCreator(entity)(
      payload, { isListHook: true }
    ));
  });

  const setFilters = newFilters => {
    setPrevFilters(filters);
    setCurrFilters(newFilters);
    fetchList(middleware, dispatch, entity, newFilters);
  };
  const upsert = payload => write(payload, actions.upsert);
  const remove = payload => write(payload, actions.remove);

  const key = buildKey(filters);
  const prevKey = buildKey(prevFilters);

  return {
    items: state[key]?.result || [],
    meta: state[key]?.meta || {},
    filters,
    status: state[key]?.status || statuses.PENDING,
    error: state[key]?.error,
    prevFilters,
    prevItems: state[prevKey]?.result,
    prevMeta: state[prevKey]?.meta,
    setFilters,
    upsert,
    remove,
  };
};
