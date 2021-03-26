const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 4444;

const PAGE_SIZE = 3;

const todosRepo = {
  0: {
    id: 0,
    todo: 'Ha!',
    description: 'Good!',
  },
  1: {
    id: 1,
    todo: 'HHa!',
    description: 'Good!',
  },
  2: {
    id: 2,
    todo: 'GHa!',
    description: 'Good!',
  },
  3: {
    id: 3,
    todo: 'JHa!',
    description: 'Good!',
  },
};

app.use(cors());
app.use(bodyParser.json());

const validateUnique = (theTodo) => Object.values(todosRepo)
  .reduce((isValid, { id, todo }) => (
    isValid && (todo != theTodo.todo || id == theTodo.id)
  ), true);

app.get('/todos', (req, res) => {
  const page = req?.query?.page || 1;

  const todos = Object
    .values(todosRepo)
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  res.json({
    data: todos,
    count: Object.values(todosRepo).length,
  });
});

app.get('/todos/:id', (req, res) => {
  if (!todosRepo[req.params.id]) {
    return res.status(404).json();
  }

  res.json(todosRepo[req.params.id]);
});

app.post('/todos', (req, res) => {
  const newTodo = req.body;
  delete newTodo.id;

  if (!validateUnique(newTodo)) {
    return res.status(422).json({
      _error: 'Todo must be unique',
    });
  }

  newTodo.id = Object.values(todosRepo).length;
  todosRepo[newTodo.id] = newTodo;

  res.json(newTodo);
});

app.put('/todos/:id', (req, res) => {
  if (!todosRepo[req.params.id]) {
    return res.status(404).json();
  }

  const theTodo = req.body;
  theTodo.id = req.params.id;

  if (!validateUnique(theTodo)) {
    return res.status(422).json({
      _error: 'Todo must be unique',
    });
  }

  todosRepo[req.params.id] = {
    ...todosRepo[req.params.id],
    ...theTodo,
  };

  res.json(todosRepo[req.params.id]);
});

app.delete('/todos/:id', (req, res) => {
  if (!todosRepo[req.params.id]) {
    return res.status(404).json();
  }

  delete todosRepo[req.params.id];

  res.status(204).json();
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
