import React from 'react';

import TodosView from './TodosView';

const Todos = ({ todos, fetchTodos, page }) => {
  React.useEffect(() => {
    fetchTodos({ page });
  }, [fetchTodos, page]);

  return <TodosView todos={todos} />;
};

export default Todos;
