import { connect } from 'react-redux';
import { fetch } from 'snowbox';

import todo from '../../entities/todo';

import Todos from './Todos';

export default connect(null, { fetchTodos: fetch([todo]) })(Todos);
