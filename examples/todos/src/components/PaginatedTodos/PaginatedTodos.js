import React from 'react';
import { useSelector } from 'react-redux';

import { selectMeta } from '../../snowbox/src';

import todo from '../../entities/todo';

import PaginatedTodosView from './PaginatedTodosView';

const PAGE_SIZE = 3;

const selectTodoMeta = selectMeta(todo);

const PaginatedTodos = ({ children }) => {
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState('pending');
  const meta = useSelector(state => selectTodoMeta(state, { page, filter }));

  const pages = Array(Math.ceil((meta?.count || 0) / PAGE_SIZE))
    .fill(0)
    .map((_, idx) => idx + 1);

  return (
    <PaginatedTodosView {...{ page, pages, setPage, filter, setFilter }} />
  );
}

export default PaginatedTodos;
