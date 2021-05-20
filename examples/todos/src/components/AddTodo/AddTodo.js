import { compose } from 'redux';
import { connect } from 'react-redux';
import { withForm, upsert, fetch } from '../../snowbox/src';

import todo from '../../entities/todo';

import AddTodoView from './AddTodoView';

const fields = {
  todo: {
    presence: { allowEmpty: false },
  },
};

const submitForm = async ({ saveTodo, fetchTodos }, data, setServerErrors) => {
  await saveTodo(data);
  fetchTodos({ page: 1 });
};

export default compose(
  connect(null, {
    saveTodo: upsert(todo),
    fetchTodos: fetch([todo]),
  }),
  withForm({ fields, submitForm }),
)(AddTodoView);
