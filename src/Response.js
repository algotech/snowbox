import _ from 'lodash';

export default class Response {
  constructor(response, options, isFetch) {
    this._response = response;
    this._isFetch = isFetch;

    this._entityPath = options.entityPath;
    this._entitiesPath = options.entitiesPath;
    this._entitiesFieldName = options.entitiesFieldName;
    this._hasMeta = options.hasMeta;
    this._metaPath = options.metaPath;
    this._metaFieldName = options.metaFieldName;
  }

  get data() {
    return this._isFetch ?
      _.get(this._response, this._entitiesPath, this._response) :
      _.get(this._response, this._entityPath, this._response);
  }

  get meta() {
    if (!this._isFetch || !this._hasMeta) {
      return undefined;
    }

    const responseWithoutEntities = _.omit(this._response, this._entitiesPath);

    return _.get(
      responseWithoutEntities,
      this._metaPath,
      responseWithoutEntities
    );
  }

  get original() {
    return this._response;
  }

  get converted() {
    if (!this._isFetch) {
      return this.original;
    }

    return {
      [this._entitiesFieldName]: this.entities,
      [this._metaFieldName]: this.meta,
    };
  }
}
