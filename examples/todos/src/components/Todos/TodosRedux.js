import { connect } from 'react-redux';
import { fetch, selectCollection } from '../../snowbox/src';

import todo from '../../entities/todo';

import Todos from './Todos';

const todosSelector = selectCollection(todo);

const mapStateToProps = (state, { page }) => ({
  todos: todosSelector(state, { page }),
});

const mapDispatchToProps = {
  fetchTodos: fetch([todo]),
};

export default connect(mapStateToProps, mapDispatchToProps)(Todos);
