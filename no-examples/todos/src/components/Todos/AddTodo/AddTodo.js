import { withForm } from 'snowbox';

import AddTodoView from './AddTodoView';

const fields = {
  todo: {
    presence: { allowEmpty: false },
  },
};

const submitForm = async ({ saveTodo, fetchTodos, filter }, data) => {
  await saveTodo(data);
  fetchTodos({ filter });
};

export default withForm({ fields, submitForm })(AddTodoView);
