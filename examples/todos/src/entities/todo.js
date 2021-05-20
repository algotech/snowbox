import { entity } from '../snowbox/src';

import provider from '../snowbox/provider';

const todosProvider = provider({
  particle: 'todos',
});

const todo = entity('todos', todosProvider, {}, {
  fetchEntitiesPath: 'data',
});

export default todo;
