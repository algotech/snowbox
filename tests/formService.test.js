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
          foo: { valid: true, touched: false, error: null, value: null },
          bar: { valid: true, touched: false, error: null, value: null },
          baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: true, touched: false, error: null, value: 1 },
          bar: { valid: true, touched: false, error: null, value: 'b' },
          baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: true, touched: false, error: null, value: 9 },
          bar: { valid: true, touched: false, error: null, value: 'y' },
          baz: { valid: true, touched: false, error: null, value: false },
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
          foo: { valid: true, touched: false, error: null, value: 9 },
          bar: { valid: true, touched: false, error: null, value: 'y' },
          baz: { valid: true, touched: false, error: null, value: false },
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
          foo: { valid: true, touched: false, error: null, value: null },
          bar: { valid: true, touched: false, error: null, value: null },
          baz: { valid: true, touched: false, error: null, value: null },
        },
      });

      expect(state).toStrictEqual({
        valid: false,
        touched: false,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: false, touched: false, error: 'Foo bad', value: null },
          bar: { valid: false, touched: false, error: 'Bar bad', value: null },
          baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: false, touched: false, error: 'Foo bad', value: 2 },
          bar: { valid: false, touched: false, error: 'Bar bad', value: 3 },
          baz: { valid: true, touched: false, error: null, value: null },
        },
      });

      expect(state).toStrictEqual({
        valid: true,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: false, error: null, value: 2 },
          bar: { valid: true, touched: false, error: null, value: 3 },
          baz: { valid: true, touched: false, error: null, value: null },
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
            foo: { valid: false, touched: false, error: 'Foo bad', value: null },
            bar: { valid: false, touched: false, error: null, value: 3 },
            baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: true, touched: false, error: null, value: 2 },
          bar: { valid: true, touched: false, error: null, value: 3 },
          baz: { valid: true, touched: false, error: null, value: null },
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
            foo: { valid: false, touched: false, error: 'Foo bad', value: null },
            bar: { valid: false, touched: false, error: null, value: 3 },
            baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: false, touched: true, error: 'Foo bad', value: null },
          bar: { valid: false, touched: false, error: null, value: 3 },
          baz: { valid: true, touched: false, error: null, value: null },
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
            foo: { valid: true, touched: false, error: null, value: 2 },
            bar: { valid: true, touched: false, error: null, value: 3 },
            baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: false, touched: false, error: 'Foo bad', value: 2 },
          bar: { valid: true, touched: false, error: null, value: 3 },
          baz: { valid: true, touched: false, error: null, value: null },
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
            foo: { valid: true, touched: false, error: null, value: 2 },
            bar: { valid: true, touched: false, error: null, value: 3 },
            baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: true, touched: false, error: null, value: 2 },
          bar: { valid: true, touched: false, error: null, value: 3 },
          baz: { valid: true, touched: false, error: null, value: null },
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
          foo: { valid: true, touched: false, error: null, value: 2 },
          bar: { valid: true, touched: false, error: null, value: 3 },
          baz: { valid: true, touched: false, error: null, value: null },
        },
      });

      expect(state).toStrictEqual({
        valid: true,
        touched: true,
        error: null,
        submitted: true,
        fields: {
          foo: { valid: true, touched: true, error: null, value: 2 },
          bar: { valid: true, touched: true, error: null, value: 3 },
          baz: { valid: true, touched: true, error: null, value: null },
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
          foo: { valid: true, touched: false, error: null, value: 2 },
          bar: { valid: false, touched: true, error: 'bad', value: null },
          baz: { valid: true, touched: false, error: null, value: null },
        },
      });

      expect(state).toStrictEqual({
        valid: false,
        touched: true,
        error: null,
        submitted: false,
        fields: {
          foo: { valid: true, touched: true, error: null, value: 2 },
          bar: { valid: false, touched: true, error: 'bad' , value: null },
          baz: { valid: true, touched: true, error: null, value: null },
        },
      });
    });
  });
});
