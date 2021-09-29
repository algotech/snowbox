import React, { useEffect } from 'react';

import ListView from './ListView';

const List = ({ todos, filter, fetchTodos, upsertTodo, removeTodo }) => {
  useEffect(() => {
    fetchTodos({ filter });
  }, []);

  const handleComplete = async (id, done) => {
    if (done) {
      return;
    }

    await upsertTodo({ id, done: true });
    console.log('>>>FFF', filter);
    fetchTodos({ filter });
  };

  const handleDelete = async (id) => {
    await removeTodo({ id });
    fetchTodos({ filter });
  };

  return (
    <ListView
      todos={todos}
      filter={filter}
      onComplete={handleComplete}
      onDelete={handleDelete}
    />
  );
};

export default List;
