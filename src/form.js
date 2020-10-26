import React, { useState } from 'react';
import hoistStatics from 'hoist-non-react-statics'
import validate from 'validate.js';

const withForm = ({ fieldConstraints, initialValues = {} }) => WrappedComponent => {
  const fieldList = Object.keys(fieldConstraints);

  const buildInitialState = () => {
    const state = {
      valid: true,
      touched: false,
      error: null,
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

  const SnowForm = ({ onSubmit, ...ownProps }) => {
    const [state, setState] = useState(buildInitialState());

    const getData = () => {
      return fieldList.reduce((data, field) => ({
        ...data,
        [field]: state.fields[field].value,
      }), {});
    }

    const validateForm = (formState) => {
      const errors = validate(getData(), constraints);

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
        touched: true,
        fields: {
          ...state.fields,
          [field]: { ...state.fields[field], value, touched: true },
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
        fields: {
          ...state.fields,
          [field]: { ...state.fields[field], touched: true },
        },
      });
    };

    const onSubmit = () => {
      const newState = fieldList.reduce((field, newState) => ({
        ...newState,
        fields: {
          ...newState.fields,
          [field]: { ...newState.fields[field], touched: true },
        },
      }), state);

      setState(newState);

      if (newState.valid) {
        onSubmit(getData());
      }
    };

    return (
      <WrappedComponent {...{
        ...ownProps,
        form: state,
        onFieldChange: onChange,
        onFieldBlur: onBlur,
      }} />
    );
  };

  return hoistStatics(SnowForm, WrappedComponent);
};

export default withForm;
