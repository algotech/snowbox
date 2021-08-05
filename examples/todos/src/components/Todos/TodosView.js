import React from 'react';

import AddTodo from './AddTodo';
import Filters from './Filters';
import List from './List';
import './Todos.css';

const TodosView = ({
  filter,
  setFilter,
}) => (
  <>
    <AddTodo {...{ filter }} />

    <Filters filter={filter} setFilter={setFilter} />

    <List {...{ filter }} />
  </>
);

export default TodosView;
