import React from 'react';

import AddTodo from './AddTodo';
import Filters from './Filters';
import Todos from './Todos';
import Pagination from './Pagination';
import './PaginatedTodos.css';

const PaginatedTodosView = ({
  todos,
  page,
  pages,
  setPage,
  filter,
  setFilter,
  upsert,
  remove,
}) => (
  <>
    <AddTodo {...{ upsert }} />

    <Filters filter={filter} setFilter={setFilter} />

    <Todos {...{ todos, filter, upsert, remove }} />

    <Pagination {...{ pages, page, setPage }} />
  </>
);

export default PaginatedTodosView;
