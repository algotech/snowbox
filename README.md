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
