import AddTodo from '../AddTodo';
import PaginatedTodos from '../PaginatedTodos';

import logo from './logo.png';
import './App.css';

const AppView = () => (
  <div className="App">
    <header className="App-header">

      <img src={logo} className="App-logo" alt="logo" />
      <p>Todos</p>
    </header>

    <AddTodo />
    <PaginatedTodos />

  </div>
);

export default AppView;
