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

## API

### api(options)
- `options`: _object_
	- `baseUrl`: _string_ **required** The base url where all the api requests go (e.g. `https://my.awesome.server/api`).
	- `tokenHeader`: _string_ The name of the header for the authentication token. Must be string. **required** when `getAuthToken` is defined.
	- `getAuthToken`: _function_ Returns the authentication token. **required** when `tokenHeader` si defined.

#### Api methods:
- ##### `get(path, params)` 
  Makes a GET HTTP request and returns the response.

  Params:
	- `path`: _string_ **required** Together with `options.baseUrl` it forms the destination url.
	- `params`: _object_ The query params of the request.

  Returns:
	- `object` Server response.

- ##### `post(path, data = {}, params, contentType)`
  Makes a POST HTTP request and returns the `serverResponse`.
  
  Params:
	- `path`: _string_ **required** Together with `options.baseUrl` it forms the destination url.
	- `data`: _object_ The body of the request.
	- `params`: _object_ The query params of the request.
	- `contentType`: _string_ The content type of the request.
  
  Returns:
	- `object` Server response.

- ##### `put(path, data = {}, params, contentType)`: 
  Makes a PUT HTTP request and returns the response.
  
  Params:
	- `path`: _string_ **required** Together with `options.baseUrl` it forms the destination url.
	- `data`: _object_ The body of the request.
	- `params`: _object_ The query params of the request.
	- `contentType`: _string_ The content type of the request.
  
  Returns:
	- `object` Server response.

- ##### `patch(path, data = {}, params, contentType)`: 
  Makes a PATCH HTTP request and returns the response.
  
  Params:
	- `path`: _string_ **required** Together with `options.baseUrl` it forms the destination url.
	- `data`: _object_ The body of the request.
	- `params`: _object_ The query params of the request.
	- `contentType`: _string_ The content type of the request.
  
  Returns:
	- `object` Server response.

- ##### `remove(path)`: 
  Makes a DELETE HTTP request and returns the response.
  
  Params:
	- `path`: _string_ **required** Together with `options.baseUrl` it forms the destination url.

  Returns:
	- `object` Server response.

- ##### `request(method, path, params, data, contentType)`: 
  Makes a HTTP request and returns `serverResponse`. It is the function called by all the other `api` functions.
  
  Params:
	- `method`: _string_ **required** The HTTP method of the request.
	- `path`: _string_ **required** Together with `options.baseUrl` it forms the destination url.
	- `params`: _object_ The query params of the request.
	- `data`: _object_ The body of the request.
	- `contentType`: _string_ The content type of the request.

  Returns:
	- `object` Server response.

### provider(api)(options)
- `api`: _object_ **required** The `api` service that will make the HTTP requests.
- `options`: _object_ 
	- `particle`: _string_ **required** The resource name in a RESTful HTTP request (e.g. the `todos` in `http://localhost:3000/api/todos/9`).
	- `idField`: _string_ The field where the unique ID for each of this entity can be found. Defaults to `'id'`.
	- `entityPath`: _string_ The path where the entity data is found in non `fetch` responses. Uses `lodash.get` behind the scenes. Defaults to `'data'`.
	- `entitiesPath`: _string_ The path where the entities data is found in the `fetch` responses. Uses `lodash.get` behind the scenes. Defaults to `'data'`.
	- `entitiesFieldName`: _string_ The field name for the entities in the result of `fetch` requests. Defaults to `'records'`.
	- `hasMeta`: _boolean_ Whether the fetch response has metadata or not. Defaults to `false`.
	- `metaPath`: _string_ The path where the metadata is found in the `fetch` response. Uses `lodash.get` behind the scenes. Defaults to `''`. If `metaPath` is a parent of `entitiesPath`, the entities will be removed from the metadata object.
	- `metaFieldName`: _string_ The field name for the metadata in the result of `fetch` request. Defaults to `'meta'`.
	- `findPath(filter, options)`: _function_ Returns the HTTP path for `find` requests. Defaults to `/<particle>/<filter[idField]>`. The function is called with:
		- `filter`: _object_ The `filter` passed to `find`.
		- `options`: _object_ The provider options.
	- `findParams(filter, options)`: _function_ Returns the query params for `find` requests. Defaults to everything in the `filter` object but without the `<idField>`. The function is called with:
		- `filter`: _object_ The `filter` passed to `find`.
		- `options`: _object_ The provider options.
	- `fetchPath(filter, options)`: _function_ Returns the HTTP path for `fetch` requests. Defaults to `/<particle>`. The function is called with:
		- `filter`: _object_ The `filter` passed to `fetch`.
		- `options`: _object_ The provider options.
	- `fetchParams(filter, options)`: _function_ Returns the query params for `fetch` requests. Defaults to everything in the `filter` object but the `<idField>`. The function is called with:
		- `filter`: _object_ The filter passed to `fetch`.
		- `options`: _object_ The provider options.
	- `createMethod`: _string_ The HTTP method for create requests (when the `<idField>` is missing in the `data` sent to `upsert`). It can be `post`, `put `, or `patch`. Defaults to `post`.
	- `updateMethod`: _string_ The HTTP method for update requests (when the `<idField>` is present in the `data` sent to `upsert`). It can be `post`, `put `, or `patch`. Defaults to `put`.
	- `upsertContentType`: _string_ The content type of the create and update requests. Can be one of `snowbox.contentTypes.JSON` and `snowbox.contentTypes.FORM_DATA`. When the content type is `FORM_DATA`, the `api` will transform the `data` object sent to `upsert` into `FormData`. Defaults to `JSON`.
	- `upsertPath(data, options)`: _function_ Returns the HTTP path for `upsert` requests. Defaults to `/<particle>` for create and `/<particle>/<data[idField]>` for update. The function is called with:
		- `data`: _object_ The `data` passed to `upsert`.
		- `options`: _object_  The provider options.
	- `upsertMethod`: _string_ The HTTP method for upsert requests. Defaults to `options.createMethod` for create and `options.updateMethod` for update.
	- `removeMethod`: _sring_ The HTTP method for remove requests. It can be `delete`, `post`, `put `, or `patch`. Defaults to `delete`.
	- `removePath(data, options)`: _function_ Returns the HTTP path for `remove` requests. Defaults to `/<particle>/<data[idField]>`. The function is called with:
		- `data`: The `data` passed to `remove`.
		- `options`: _object_  The provider options.

#### Provider methods:

- ##### `find(filter)`: 
  Calls `[GET] <api.options.baseUrl/options.findPath?options.findParams` and returns `Response`.
  
  Params:
	- `filter`: _object_ The filter for the requested resource.
	
  Returns:
	- `Response` 
  
- ##### `fetch(filter)`: 
  Calls `[GET] api.options.baseUrl/options.fetchPath?options.fetchParams` and returns `Response`.
  
  Params:
	- `filter`: _object_ The filter for the requested resources.

  Returns:
	- `Response`

- ##### `upsert(data, params)`: 
  Calls `[options.upsertMethod] api.options.baseUrl/options.upsertPath?params` and returns `Response`.
  
  Params:
	- `data`: _object_ The body of the request.
	- `params`: _object_ The HTTP query params.

  Returns:
	- `Response`

- ##### `remove(data)`: 
  Calls `[options.removeMethod] api.options.baseUrl/options.removePath` and returns `Response`.
  
  Params:
	- `data`: _object_ Usually the deleted resource.

  Returns:
	- `Response`

### Response(response, options, isFetch)
- `response`: _object_ **required** The response object received from the server.
- `options`: _object_
	- `entityPath`: _string_ The path where the entity data is found in the `find` response. This will be the result of the `find` request. Uses `lodash.get` behind the scenes. Defaults to `'data'`.
	- `entitiesPath`: _string_ The path where the entities data is found in the `fetch` response. Uses `lodash.get` behind the scenes. Defaults to `'data'`.
	- `entitiesFieldName`: _string_ The field name for the entities in the result of `fetch` request. Defaults to `'records'`.
	- `hasMeta`: _boolean_ Whether the fetch response has metadata or not. Defaults to `false`.
	- `metaPath`: _string_ The path where the metadata is found in the `fetch` response. Uses `lodash.get` behind the scenes. Defaults to `''`. If `metaPath` is a parent of `entitiesPath`, the entities will be removed from the metadata object.
	- `metaFieldName`: _string_ The field name for the metadata in the result of `fetch` request. Defaults to `'meta'`.
- `isFetch`: _boolean_ Whether the response belongs to a `fetch` request. Defaults to `false`.

#### Instance fields
- `data`: _any_ `serverResponse[options.entitiesPath]` for `fetch` requests and `serverResponse[options.entityPath]` for everything else. When `entitiesPath` or `entittPath` is not defined it returns the `serverResponse`.
- `meta`: _any_ `serverResponse[options.metaPath]` for `fetch` requests where `options.hasMeta == true` and `undefined` for everything else.
- `original`: _object_ Returns the `serverResponse`.
- `converted`: _object_ When the request is not `fetch` it returns `response.data`. When the request is `fetch` it returns:
```
{ 
   <options.entitiesFieldName>: serverResponse[options.entitiesPath], 
   <options.metaFieldName>: serverResponse[options.metaPath],
}
```

### entity(key, provider, definition = {}, options = {})
- `key`: _string_ **required** The key name under which all entities of this type will be listed in the normalized response. See [normalizr](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--).
- `provider`: _object_ A provider object that will be used to make requests to a remote server. Defaults to undefined.
- `definition`: _object_ A definition of the nested entities found within this entity. Defaults to empty object. See [normalizr](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--).
- `options`:
	- all the options available for the [normalizr Entity](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--).
	- `staleTimeout`: _number_ Amount of milliseconds that the entity will be considered fresh. `fetch` and `find` actions won’t make remote calls to load entities resources unless fresh data is specifically requested. Defaults to `undefined` (i.e. all the requests are made).
	- `singleton`: _boolean_ When `true`, it means that there is only one entity of that type (useful for the logged user). Defaults to `false`.

### actions
- `find(entity)(payload, meta = {})`: Requests a resource from the remote server and populates the state with the result.
	- `meta`: _object_
		- `refresh`: _boolean_ Force the request for fresh data even when the state is not stale. Defaults to `false`.
- `fetch(entity)(payload, meta = {})`: Requests a collection from the remote server and populates the state with the result.
	- `meta`: _object_
		- `refresh`: _boolean_ Force the request for fresh data even when the state is not stale. Defaults to `false`.
- `upsert(entity)(payload, meta = {})`: Sends a create or update request to the remote server and populates the state with the result.
- `remove(entity)(payload, meta = {})`: Sends a delete request to the remote server and populates the state with the result. 
- `clearAll(payload)`: Clears the entire snowbox state. Useful when the user logs out. 

### selectors
- `selectOne(entity, hydrationLevels = 0, idField)(state, props)`:  Selects the entity record that has the ID equal to `props[idField || entity.idField]`.
	- `entity`: _object_ **required** An `entity`.
	- `hydrationLevels`: _number_ Defines how many levels of nested entities will be denormalized. Defauls to zero.
	- `idField`: _string_ The unique ID field name of the entity. Usually, the default `entity.fieldId` should be used.
	- `state`: _object_ **required** Redux state.
	- `props`: _object_ **required** Component props.
- `selectCollection(entity, hydrationLevels = 0)(state, filter)`: Selects a collection that was requested with the `fetch` action. The `filter` passed here must match the `payload` of the `fetch` action.
	- `entity`: _object_ **required** An `entity`.
	- `hydrationLevels`: _number_ Defines how many levels of nested entities will be denormalized. Defauls to zero.
	- `state`: _object_ **required** Redux state.
	- `filter`: _object_ **required** The filter used for selecting the collection.
- `selectAll(entity, hydrationLevels = 0)(state)`: Selects all the records of the entity that have been loaded on the state.
	- `entity`: _object_ **required** An `entity`.
	- `hydrationLevels`: _number_ Defines how many levels of nested entities will be denormalized. Defauls to zero.
	- `state`: _object_ **required** Redux state.
- `selectMeta(entity)(state, filter)`: Selects the `meta` object that was loaded with the `fetch` action. The `filter` passed here must match the `payload` of the `fetch` action.
	- `entity`: _object_ **required** An `entity`.
	- `state`: _object_ **required** Redux state.
	- `filter`: _object_ **required** The filter used for selecting the collection.

### Hooks
- #### `useList(entity, initialFilters = {})`: 
	- `entity`: _object_ **required** An `Entity`.
	- `initialFilters`: _object_ The initial filters for the list. Defaults to `{}`.

  Returns:
		{
			items,
			meta,
			status,
			error,
			prevItems,
			prevMeta,
			setFilters,
			upsert,
			remove,
		}

### Constants

- #### contentTypes
	- `JSON`: 
	- `FORM_DATA`

- #### actions
	- `FIND`
	- `FETCH`
	- `UPSERT`
	- `REMOVE`
	- `CLEAR`

- #### statuses
	- `PENDING`
	- `SUCCEEDED`
	- `FAILED`

### Form 
!!! __Deprecated__ and will be removed.

- #### `withForm({ fields, submitForm, initialValues })` HOC
	- `fields`: _object_ **required** An object with the form fields and the validation rules (processed by [validate.js](http://validatejs.org)).
	- `submitForm(ownProps, formData, setServerErrors)`: _function_ Will be called when the form is submitted
		- `ownProps`: _object_
		- `formData`: _object_
		- `setServerErrors`: _function_
	- `initialValues`: _object_
