import React, { useState } from 'react';

import TodosView from './TodosView';

const Todos = ({ fetchTodos }) => {
  const [filter, setFilter] = useState('pending');

  const onSetFilter = (newFilter) => {
    setFilter(newFilter);
    fetchTodos({ filter: newFilter });
  };

  return (
    <TodosView
      {...{
        filter,
        setFilter: onSetFilter,
      }}
    />
  );
}

export default Todos;
