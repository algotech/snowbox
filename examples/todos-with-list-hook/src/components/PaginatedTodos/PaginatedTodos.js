import React from 'react';
import { useList } from 'snowbox';

import todo from '../../entities/todo';

import PaginatedTodosView from './PaginatedTodosView';

const PAGE_SIZE = 3;

const PaginatedTodos = ({ children }) => {
  const {
    items: todos,
    meta,
    filters,
    setFilters,
    upsert,
    remove,
  } = useList(todo, { page: 1, pageSize: PAGE_SIZE, filter: 'pending' });

  const pages = Array(Math.ceil((meta?.count || 0) / PAGE_SIZE))
    .fill(0)
    .map((_, idx) => idx + 1);

  return (
    <PaginatedTodosView
      {...{
        todos,
        page: filters.page,
        pages,
        setPage: page => setFilters({ ...filters, page }),
        filter: filters.filter,
        setFilter: filter => setFilters({ ...filters, filter, page: 1 }),
        upsert,
        remove,
      }}
    />
  );
}

export default PaginatedTodos;
