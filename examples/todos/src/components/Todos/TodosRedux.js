
import todo from '../../entities/todo';

import Todos from './Todos';


const mapStateToProps = (state, { page }) => ({
  todos: todosSelector(state, { page }),
});

const mapDispatchToProps = {
  fetchTodos: fetch([todo]),
};

export default connect(mapStateToProps, mapDispatchToProps)(Todos);
