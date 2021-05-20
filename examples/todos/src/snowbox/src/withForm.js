import React, { useState, useRef, useEffect } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import createFormService from './formService';

const withForm = ({
  fields: fieldConstraints,
  submitForm,
  initialValues = {},
}) => WrappedComponent => {
  const fieldList = Object.keys(fieldConstraints);
  const formService = createFormService(fieldList, fieldConstraints);

  const SnowForm = (ownProps = {}) => {
    const [state, setState] = useState(
      formService.buildInitialState(
        initialValues,
        ownProps.initialValues
      )
    );
    const firstRender = useRef(true);

    useEffect(() => {
      if (firstRender.current) {
        firstRender.current = false;
        setState(formService.validate(state));
      }
    });

    const onChange = (field, value) => {
      setState(formService.handleChange(state, field, value));
    };

    const onBlur = field => {
      setState(formService.handleBlur(state, field));
    };

    const setServerErrors = (errors) => {
      setState(formService.handleServerErrors(state, errors));
    };

    const onSubmit = async (e) => {
      e.preventDefault();

      const newState = formService.handleSubmit(state);

      setState(newState);

      if (!newState.valid) {
        return;
      }

      const resetState = await submitForm(
        ownProps,
        formService.getData(newState),
        setServerErrors
      );

      if (resetState !== false) {
        setState(formService.buildInitialState(
          initialValues,
          ownProps.initialValues
        ));
        firstRender.current = true;
      }
    };

    const fieldsProp = Object.keys(state.fields).reduce((fields, name) => ({
      ...fields,
      [name]: {
        ...state.fields[name],
        name,
        onBlur: () => onBlur(name),
        onChange: (value) => onChange(name, value),
      },
    }), {});

    return (
      <WrappedComponent {...{
        ...ownProps,
        fields: fieldsProp,
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
