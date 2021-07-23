# snowbox [![Build Status](https://travis-ci.com/algotech/snowbox.svg?branch=master)](https://travis-ci.com/algotech/snowbox)[![codecov](https://codecov.io/gh/algotech/snowbox/branch/master/graph/badge.svg)](https://codecov.io/gh/algotech/snowbox)

Opinionated Redux abstractions for faster development.

## Motivation
Most of the time, for each type of entity in your [redux](https://github.com/reduxjs/redux) store, you have to implement the same actions, reducers, and selectors, over and over again. The same story holds true when it comes to calling your remote server.

## Solution
Snowbox is a small collection of tools that hide the repetitiveness in your code and lets you focus on writing code that is trully important for your app. They are built on top of [redux](https://github.com/reduxjs/redux), [normalizr](https://github.com/paularmstrong/normalizr), [reselect](https://github.com/reduxjs/reselect), and [immer](https://github.com/immerjs/immer).

## Table of Contents
- [Install](#install)
- [Quick Start](#quick-start)
- [Api](#api)
	- [api](#apioptions)
		- [get](#getpath-params)
		- [post](#postpath-data---params-contenttype)
		- [put](#putpath-data---params-contenttype)
		- [patch](#patchpath-data---params-contenttype)
		- [remove](#removepath)
		- [request](#requestmethod-path-params-data-contenttype)
	- [provider](#providerapioptions)
		- [find](#findfilter)
		- [fetch](#fetchfilter)
		- [upsert](#upsertdata-params)
		- [remove](#removedata)
	- [Response](#responseresponse-options-isfetch)
	- [entity](#entitykey-provider-definition---options--)
	- [actions](#actions)
	- [selectors](#selectors)
	- [Hooks](#hooks)
	- [Constants](#constants)
	- [Form](#form)
- [Exmples](#examples)

# Install

Install from the NPM repository using yarn or npm:

```shell
yarn add snowbox
```

```shell
npm install snowbox
```

## Quick Start

1) Add the snowbox reducer and middleware to your store. The key where the snowbox reducer is mounted must be `snowbox`.
```javascript
// File: app-store.js

import { createStore, combineReducers, applyMiddleware } from 'redux';
import { snowboxReducer, snowboxMiddleware } from 'snowbox';

const store = createStore(
	combineReducers({
		snowbox: snowboxReducer,
		/* app reducers */
	}),
	preloadedState,
	applyMiddleware(
		snowboxMiddleware,
		/* app middlewares */
	)
);
```

2) Configure the `api` and `provider` services.
```javascript
// File: app-provider.js

import { api, provider } from 'snowbox';

import store from './app-store';
import selectAuthToken from './app-selectors';

export const appApi = api({
	baseUrl: 'http://localhost:3000/api',
	tokenHeader: 'auth-token',
	getAuthToken: () => selectAuthToken(store.getState()), // when your token is stored in the state
});

export const appProvider = provider(api);

export default appProvider;
```

3) Define an entity
```javascript
// File: entities/todo.js

import { entity } from 'snowbox';

import appProvider from '../app-provider';

export const todoProvider = appProvider({
	particle: 'todos',
});

export const todo = entity('todos', todoProvider);

export default todo;
```

4) Build your awesome app
```javascript
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetch, selectCollection } from 'snowbox';

import todo from 'entities/todo'; // Import the todo entity
import Todo from './Todo';

const todosSelector = selectCollection(todo); // Create the selector for todos

export default function MyTodos({ filter }) {
	const dispatch = useDispatch();
	const todos = useSelector(todosSelector); // Select your todos
	
	useEffect(() => {
		dispatch(fetch(todo)(filter)); // Request todos
	}, [dispatch, fetch, todo, filter]);
	
	return todos.map(item => <Todo key={item.id} todo={item} />);
}
```
