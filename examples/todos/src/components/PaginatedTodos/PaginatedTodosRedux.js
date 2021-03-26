import React from 'react';
import { useSelector } from 'react-redux';

import { selectMeta } from '../../snowbox/src';

import todo from '../../entities/todo';
import Todos from '../Todos';

import Pagination from './Pagination';
import './PaginatedTodos.css';

const PAGE_SIZE = 3;

const selectTodoMeta = selectMeta(todo);

const PaginatedTodos = ({ children }) => {
  const [page, setPage] = React.useState(1);
  const meta = useSelector(state => selectTodoMeta(state, { page }));

  const pages = Array(Math.ceil((meta?.count || 0) / PAGE_SIZE))
    .fill(0)
    .map((_, idx) => idx + 1);

  return (
    <>
      <Todos page={page} />

      <Pagination {...{ pages, page, setPage }} />
    </>
  );
}

export default PaginatedTodos;
