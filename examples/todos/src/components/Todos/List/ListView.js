import { HiOutlineCheck } from 'react-icons/hi';
import { RiDeleteBin7Line } from 'react-icons/ri';
import { AiOutlineFileDone } from 'react-icons/ai';
import { GiEmptyWoodBucketHandle } from 'react-icons/gi';

import './List.css';

const ListView = ({ todos = [], filter, onComplete, onDelete }) => {
  if (!todos.length && filter === 'pending') {
    return <AiOutlineFileDone size={256} color="#229922" />;
  }

  if (!todos.length) {
    return <GiEmptyWoodBucketHandle size={256} color="#999999" />;
  }

  return todos.map(({ id, todo, done}) => (
    <div key={id} className="List-container">
      <div className={`List-todo ${done ? 'done' : ''}`}>
        <HiOutlineCheck
          className="List-check"
          onClick={() => onComplete(id, done)}
        />
        {todo}
        <RiDeleteBin7Line
          className="List-delete"
          onClick={() => onDelete(id)}
        />
      </div>
    </div>
  ));
}

export default ListView;
