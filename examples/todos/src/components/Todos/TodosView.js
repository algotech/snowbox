import './Todos.css';

const TodosView = ({ todos = [] }) => {
  return todos.map(({ id, todo, description }) => (
    <div key={id} className="Todo-container">
      <div className="Todo-todo">
        {todo}
      </div>
      <div className="Todo-description">
        {description}
      </div>
    </div>
  ));
}

export default TodosView;
