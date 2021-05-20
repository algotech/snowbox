const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 4444;

const PAGE_SIZE = 5;

let idCounter = 0;
const genId = () => {
  idCounter += 1;

  return idCounter;
};

const todosRepo = {};

app.use(cors());
app.use(bodyParser.json());

const validateUnique = (theTodo) => Object.values(todosRepo)
  .reduce((isValid, { id, todo }) => (
    isValid && (todo != theTodo.todo || id == theTodo.id)
  ), true);

app.get('/todos', (req, res) => {
  const page = req?.query?.page || 1;
  const filter = req?.query?.filter || 'pending';


  const filteredTodos = Object
    .values(todosRepo)
    .filter(todo => {
      switch (filter) {
        case 'complete': return todo.done;
        case 'all': return true;
        case 'pending':
        default :
          return !todo.done;
      }
    });

  console.log('>>', filter, filteredTodos);

  const todos = filteredTodos
    .sort((a, b) => a.date > b.date ? -1 : 1)
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  res.json({
    data: todos,
    count: filteredTodos.length,
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

  newTodo.id = genId();
  newTodo.date = new Date();
  newTodo.done = false;
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
