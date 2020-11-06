import React, { useState, useRef, useEffect } from 'react';
import hoistStatics from 'hoist-non-react-statics'
import validate from 'validate.js';

const withForm = ({
  fields: fieldConstraints,
  submitForm,
  initialValues = {},
}) => WrappedComponent => {
  const fieldList = Object.keys(fieldConstraints);

  const buildInitialState = () => {
    const state = {
      valid: true,
      touched: false,
      error: null,
      submitted: false,
      fields: {},
    };

    Object.keys(fieldConstraints).forEach(field => {
      state.fields[field] = {
        valid: true,
        touched: false,
        error: null,
        value: initialValues[field] || null,
      };
    });

    return state;
  };

  const SnowForm = (ownProps) => {
    const [state, setState] = useState(buildInitialState());
    const firstRender = useRef(true);

    useEffect(() => {
      if (firstRender.current) {
        firstRender.current = false;
        validateForm(state);
      }
    })

    const getData = (formState) => {
      return fieldList.reduce((data, field) => ({
        ...data,
        [field]: formState.fields[field].value,
      }), {});
    }

    const validateForm = (formState) => {
      const errors = validate(getData(formState), fieldConstraints);

      let isFormValid = true;

      fieldList.forEach(field => {
        const error = errors && errors[field] ? errors[field][0] : null;

        isFormValid = isFormValid && !error;

        formState = {
          ...formState,
          valid: isFormValid,
          fields: {
            ...formState.fields,
            [field]: { ...formState.fields[field], error, valid: !error },
          },
        };
      });

      setState(formState);
    }

    const onChange = (field, value) => {
      if (!fieldList.includes(field)) {
        throw new Error(`[Snowbox Form] Unknown field: ${field}`);
      }

      let newState = {
        ...state,
        fields: {
          ...state.fields,
          [field]: { ...state.fields[field], value },
        }
      };

      validateForm(newState);
    };

    const onBlur = field => {
      if (!fieldList.includes(field)) {
        throw new Error(`[Snowbox Form] Unknown field: ${field}`);
      }

      setState({
        ...state,
        touched: true,
        fields: {
          ...state.fields,
          [field]: { ...state.fields[field], touched: true },
        },
      });
    };

    const setServerErrors = (errors) => {
      const newState = fieldList.reduce((acc, field) => ({
        ...acc,
        valid: acc.valid && !errors[field],
        submitted: false,
        fields: {
          ...acc.fields,
          [field]: { ...acc.fields[field], error: errors[field], valid: false },
        },
      }), state);

      if (errors._error) {
        newState.error = errors._error;
      }

      setState(newState);
    }

    const onSubmit = () => {
      const newState = fieldList.reduce((acc, field) => ({
        ...acc,
        fields: {
          ...acc.fields,
          [field]: { ...acc.fields[field], touched: true },
        },
      }), state);

      if (newState.valid) {
        newState.submitted = true;
      }

      setState(newState);

      if (newState.valid) {
        submitForm(ownProps, getData(newState), setServerErrors);
      }
    };

    return (
      <WrappedComponent {...{
        ...ownProps,
        fields: state.fields,
        form: {
          valid: state.valid,
          touched: state.touched,
          error: state.error,
        },
        onFieldChange: onChange,
        onFieldBlur: onBlur,
        onSubmit,
      }} />
    );
  };

  return hoistStatics(SnowForm, WrappedComponent);
};

export default withForm;
