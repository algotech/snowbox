import { entity } from 'snowbox';

import provider from '../provider';

const todosProvider = provider({
  particle: 'todos',
});

const todo = entity('todos', todosProvider, {}, {
  fetchEntitiesPath: 'data',
});

export default todo;
