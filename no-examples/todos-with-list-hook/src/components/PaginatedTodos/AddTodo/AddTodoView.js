import React from 'react';

import './AddTodo.css';

const AddTodoView = ({ onSubmit, fields: { todo } }) => (
  <form className="AddTodo-container" onSubmit={onSubmit}>
    <input
      type="text"
      name="todo"
      onChange={e => todo.onChange(e.target.value)}
      value={todo.value || ''}
      placeholder="Add a ToDo"
    />

    <button></button>
  </form>
);

export default AddTodoView;
