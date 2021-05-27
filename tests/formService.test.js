import {
  default as createFormService,
  buildInitialState,
  getData,
  validate,
  handleChange,
  handleBlur,
  handleServerErrors,
  handleSubmit,
} from '../src/formService';

const fieldList = ['foo', 'bar', 'baz'];
const constraints = {
  foo: { presence: { allowEmpty: false, message: 'bad' } },
  bar: { presence: { allowEmpty: false, message: 'bad' } },
};

describe('form service', () => {
  describe('createFormService', () => {
    it('creates the service with each function configured', () => {
      const fieldsList = ['foo', 'bar'];
      const constraints = { foo: {}, bar: { required: true } };
      const service = createFormService(fieldsList, constraints);

      expect(service).toBe.object;
      expect(service.buildInitialState).toBe.function;
      expect(service.getData).toBe.function;
      expect(service.validate).toBe.function;
      expect(service.handleChange).toBe.function;
      expect(service.handleBlur).toBe.function;
      expect(service.handleServerErrors).toBe.function;
      expect(service.handleSubmit).toBe.function;
    });
  });

  describe('buildInitialState', () => {
    it('returns the initial form state without initial values', () => {
      const state = buildInitialState(fieldList)();

      expect(state).toStrictEqual({
        valid: true,
        touched: false,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: null, dirty: false },
          bar: { valid: true, touched: false, error: null, value: null, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
        initialValues: {
          bar: null,
          baz: null,
          foo: null,
        },
      });
    });

    it('returns the initial form state with HOC initial values', () => {
      const state = buildInitialState(fieldList)({ foo: 1, bar: 'b' });

      expect(state).toStrictEqual({
        valid: true,
        touched: false,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 1, dirty: false },
          bar: { valid: true, touched: false, error: null, value: 'b', dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
        initialValues: {
          bar: 'b',
          baz: null,
          foo: 1,
        },
      });
    });

    it('returns the initial form state with props initial values', () => {
      const state = buildInitialState(fieldList)(
        { foo: 1, bar: 'b' },
        { foo: 9, bar: 'y', baz: false }
      );

      expect(state).toStrictEqual({
        valid: true,
        touched: false,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 9, dirty: false },
          bar: { valid: true, touched: false, error: null, value: 'y', dirty: false },
          baz: { valid: true, touched: false, error: null, value: false, dirty: false },
        },
        initialValues: {
          bar: 'y',
          baz: false,
          foo: 9,
        },
      });
    });
  });

  describe('getData', () => {
    it('returns the form data object', () => {
      const data = getData(fieldList)({
        valid: true,
        touched: false,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 9, dirty: false },
          bar: { valid: true, touched: false, error: null, value: 'y', dirty: false },
          baz: { valid: true, touched: false, error: null, value: false, dirty: false },
        },
      });

      expect(data).toStrictEqual({ foo: 9, bar: 'y', baz: false });
    });
  });

  describe('validate', () => {
    it('returns the state with the existing errors', () => {
      const state = validate(fieldList, constraints)({
        valid: true,
        touched: false,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: null, dirty: false },
          bar: { valid: true, touched: false, error: null, value: null, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });

      expect(state).toStrictEqual({
        valid: false,
        touched: false,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: false, touched: false, error: 'Foo bad', value: null, dirty: false },
          bar: { valid: false, touched: false, error: 'Bar bad', value: null, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });
    });

    it('returns the state validated when everything is ok', () => {
      const state = validate(fieldList, constraints)({
        valid: false,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: false, touched: false, error: 'Foo bad', value: 2, dirty: false },
          bar: { valid: false, touched: false, error: 'Bar bad', value: 3, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });

      expect(state).toStrictEqual({
        valid: true,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 2, dirty: false },
          bar: { valid: true, touched: false, error: null, value: 3, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      })
    });
  });

  describe('handleChange', () => {
    it('throws an error when the changed fields is unknown', () => {
      const fn = () => {
        handleChange(fieldList, constraints)({}, 'un', 'known');
      };

      expect(fn).toThrow(Error);
      expect(fn).toThrow('[Snowbox Form] Unknown field: un');
    });

    it('changes the field value and validates the form', () => {
      const state = handleChange(fieldList, constraints)(
        {
          valid: false,
          touched: true,
          error: null,
          submitted: false,
          fields: {
            foo: { valid: false, touched: false, error: 'Foo bad', value: null, dirty: false },
            bar: { valid: false, touched: false, error: null, value: 3, dirty: false },
            baz: { valid: true, touched: false, error: null, value: null, dirty: false },
          },
        },
        'foo',
        2
      );

      expect(state).toStrictEqual({
        valid: true,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 2, dirty: true },
          bar: { valid: true, touched: false, error: null, value: 3, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });
    });
  });

  describe('handleBlur', () => {
    it('throws an error when the changed fields is unknown', () => {
      const fn = () => {
        handleBlur(fieldList, constraints)({}, 'un');
      };

      expect(fn).toThrow(Error);
      expect(fn).toThrow('[Snowbox Form] Unknown field: un');
    });

    it('markes the field and form touched', () => {
      const state = handleBlur(fieldList)(
        {
          valid: false,
          touched: false,
          error: null,
          submitted: false,
          fields: {
            foo: { valid: false, touched: false, error: 'Foo bad', value: null, dirty: false },
            bar: { valid: false, touched: false, error: null, value: 3, dirty: false },
            baz: { valid: true, touched: false, error: null, value: null, dirty: false },
          },
        },
        'foo'
      );

      expect(state).toStrictEqual({
        valid: false,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: false, touched: true, error: 'Foo bad', value: null, dirty: false },
          bar: { valid: false, touched: false, error: null, value: 3, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });
    });
  });

  describe('handleServerErrors', () => {
    it('sets the server errors on the form', () => {
      const setServerErrors = {
        foo: 'Foo bad',
      };
      const state = handleServerErrors(fieldList)(
        {
          valid: true,
          touched: true,
          error: null,
          submitted: true,
          fields: {
            foo: { valid: true, touched: false, error: null, value: 2, dirty: false },
            bar: { valid: true, touched: false, error: null, value: 3, dirty: false },
            baz: { valid: true, touched: false, error: null, value: null, dirty: false },
          },
        },
        setServerErrors
      );

      expect(state).toStrictEqual({
        valid: false,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: false, touched: false, error: 'Foo bad', value: 2, dirty: false },
          bar: { valid: true, touched: false, error: null, value: 3, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });
    });

    it('sets the global form error', () => {
      const setServerErrors = {
        _error: 'Am I a joke to you!?',
      };
      const state = handleServerErrors(fieldList)(
        {
          valid: true,
          touched: true,
          error: null,
          submitted: true,
          fields: {
            foo: { valid: true, touched: false, error: null, value: 2, dirty: false },
            bar: { valid: true, touched: false, error: null, value: 3, dirty: false },
            baz: { valid: true, touched: false, error: null, value: null, dirty: false },
          },
        },
        setServerErrors
      );

      expect(state).toStrictEqual({
        valid: false,
        touched: true,
        error: 'Am I a joke to you!?',
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 2, dirty: false },
          bar: { valid: true, touched: false, error: null, value: 3, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });
    });
  });

  describe('handleSubmit', () => {
    it('touches all the fields and when the form is valid submits it', () => {
      const state = handleSubmit(fieldList, constraints)({
        valid: true,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 2, dirty: false },
          bar: { valid: true, touched: false, error: null, value: 3, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });

      expect(state).toStrictEqual({
        valid: true,
        touched: true,
        error: null,
        submitted: true,
        fields: {
          foo: { valid: true, touched: true, error: null, value: 2, dirty: false },
          bar: { valid: true, touched: true, error: null, value: 3, dirty: false },
          baz: { valid: true, touched: true, error: null, value: null, dirty: false },
        },
      });
    });

    it('touches all the fields and when invalid it does not submit it', () => {
      const state = handleSubmit(fieldList, constraints)({
        valid: false,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 2, dirty: false },
          bar: { valid: false, touched: true, error: 'bad', value: null, dirty: false },
          baz: { valid: true, touched: false, error: null, value: null, dirty: false },
        },
      });

      expect(state).toStrictEqual({
        valid: false,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: true, error: null, value: 2, dirty: false },
          bar: { valid: false, touched: true, error: 'bad' , value: null, dirty: false },
          baz: { valid: true, touched: true, error: null, value: null, dirty: false },
        },
      });
    });
  });
});
