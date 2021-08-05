import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { snowboxReducer, snowboxMiddleware } from 'snowbox';

import reportWebVitals from './reportWebVitals';
import './index.css';
import { App } from './components';

const store = createStore(
  combineReducers({
    snowbox: snowboxReducer,
  }),
  undefined,
  applyMiddleware(thunkMiddleware, snowboxMiddleware)
);


ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
