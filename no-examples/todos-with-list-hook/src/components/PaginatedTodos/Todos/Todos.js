import React from 'react';

import TodosView from './TodosView';

const Todos = ({ todos, filter, upsert, remove }) => {
  const handleComplete = async (id, done) => {
    if (done) {
      return;
    }

    upsert({ id, done: true });
  };

  const handleDelete = async (id) =>  remove({ id });

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
