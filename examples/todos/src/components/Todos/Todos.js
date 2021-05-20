import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetch, upsert, remove, selectCollection } from '../../snowbox/src';

import todo from '../../entities/todo';

import TodosView from './TodosView';

const selectTodos = selectCollection(todo);

const Todos = ({ page, filter }) => {
  const todos = useSelector(state => selectTodos(state, { page, filter }));
  const dispatch = useDispatch();

  React.useEffect(
    () => dispatch(fetch([todo])({ page, filter })),
    [dispatch, page, filter]
  );

  const handleComplete = async (id, done) => {
    if (done) {
      return;
    }

    await dispatch(upsert(todo)({ id, done: true }));
    dispatch(fetch([todo])({ page, filter }));
  };

  const handleDelete = async (id) => {
    await dispatch(remove(todo)({ id }));
    dispatch(fetch([todo])({ page, filter }));
  };

  console.log('REnder!', todos);

  return (
    <TodosView
      todos={todos}
      filter={filter}
      onComplete={handleComplete}
      onDelete={handleDelete}
    />
  );
};

export default Todos;
