import React from 'react';

import Todos from '../Todos';

import Filters from './Filters';
import Pagination from './Pagination';
import './PaginatedTodos.css';

const PaginatedTodosView = ({ page, pages, setPage, filter, setFilter }) => (
  <>
    <Filters filter={filter} setFilter={setFilter} />

    <Todos page={page} filter={filter} />

    <Pagination {...{ pages, page, setPage }} />
  </>
);

export default PaginatedTodosView;
