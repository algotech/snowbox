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
    const [formState, setState] = useState(
      formService.buildInitialState(
        initialValues,
        ownProps.initialValues
      )
    );
    const firstRender = useRef(true);

    useEffect(() => {
      if (firstRender.current) {
        firstRender.current = false;
        setState(state => formService.validate(state));
      }
    });

    const onChange = (field, value) => {
      setState(state => formService.handleChange(state, field, value));
    };

    const onBlur = field => {
      setState(state => formService.handleBlur(state, field));
    };

    const setServerErrors = (errors) => {
      setState(state => formService.handleServerErrors(state, errors));
    };

    const onReset = () => {
      setState(formService.buildInitialState(
        initialValues,
        ownProps.initialValues
      ));
      firstRender.current = true;
    }

    const onSubmit = async (event) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      const newState = formService.handleSubmit(formState);

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
        onReset();
      }
    };

    const fieldsProp = Object.keys(formState.fields).reduce((fields, name) => ({
      ...fields,
      [name]: {
        ...formState.fields[name],
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
          valid: formState.valid,
          touched: formState.touched,
          error: formState.error,
        },
        onFieldChange: onChange,
        onFieldBlur: onBlur,
        onSubmit,
        onReset,
      }} />
    );
  };

  return hoistStatics(SnowForm, WrappedComponent);
};

export default withForm;
