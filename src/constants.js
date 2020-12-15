const NAMESPACE = 'snowbox';

export const actions = {
  UPSERT: `${NAMESPACE}/UPSERT`,
  REMOVE: `${NAMESPACE}/REMOVE`,
  FIND: `${NAMESPACE}/FIND`,
  FETCH: `${NAMESPACE}/FETCH`,
};

export const statuses = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};

export const contentTypes = {
  JSON: `${NAMESPACE}/JSON`,
  FORM_DATA: `${NAMESPACE}/FORM_DATA`,
};
