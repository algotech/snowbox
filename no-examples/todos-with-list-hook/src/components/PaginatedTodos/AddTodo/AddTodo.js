import { withForm } from 'snowbox';

import AddTodoView from './AddTodoView';

const fields = {
  todo: {
    presence: { allowEmpty: false },
  },
};

const submitForm = async ({ upsert }, data) => {
  await upsert(data);
};

export default withForm({ fields, submitForm })(AddTodoView);
