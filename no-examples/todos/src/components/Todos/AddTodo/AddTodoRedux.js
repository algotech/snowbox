import { connect } from 'react-redux';
import { upsert, fetch } from 'snowbox';

import todo from '../../../entities/todo';
import AddTodo from './AddTodo';

export default connect(null, {
  saveTodo: upsert(todo),
  fetchTodos: fetch([todo]),
})(AddTodo);
