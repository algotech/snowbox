import { connect } from 'react-redux';
import { fetch, upsert, remove, selectCollection } from 'snowbox';

import todo from '../../../entities/todo';
import List from './List';

const mapStateToProps = (state, { filter }) => ({
  todos: selectCollection(todo)(state, { filter }),
});

const mapDispatchToProps = {
  fetchTodos: fetch([todo]),
  upsertTodo: upsert(todo),
  removeTodo: remove(todo),
};

export default connect(mapStateToProps, mapDispatchToProps)(List);
