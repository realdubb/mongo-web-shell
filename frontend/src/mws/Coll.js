/* jshint camelcase: false */
/* global mongo, console */
mongo.Coll = function (db, name) {
  if (name.length > 80){
		throw new mongo.CollectionNameError('Collection name must be 80 characters or less');
	}

	if (name.match(/(\$|\0)/)){
		throw new mongo.CollectionNameError('Collection name may not contain $ or \\0');
	}

	if (name.match(/^system\./)){
		throw new mongo.CollectionNameError('Collection name may not begin with system.*');
	}

	if (name === ''){
		throw new mongo.CollectionNameError('Collection name may not be empty');
	}

  this.name = name;
  this.db = db;
  this.shell = db.shell;
  this.urlBase = mongo.util.getDBCollectionResURL(db.shell.mwsResourceID, name);
};

mongo.Coll.prototype.toString = function () {
  return this.db.toString() + '.' + this.name;
};

// Todo: rewrite documentation in this file to reflect it's new location

/**
 * Makes a Cursor that is the result of a find request on the mongod backing
 * server.
 */
mongo.Coll.prototype.find = function (query, projection) {
  var url = this.urlBase + 'find';
  var params = {query: query, projection: projection};
  var doFind = function (onSuccess, async) {
    mongo.request.makeRequest(url, params, 'GET', 'dbCollectionFind', this.shell,
      onSuccess, async);
  }.bind(this);
  return new mongo.Cursor(this.shell, doFind);
};

mongo.Coll.prototype.insert = function (doc) {
  var url = this.urlBase + 'insert';
  var params = {document: doc};
  mongo.request.makeRequest(url, params, 'POST', 'dbCollectionInsert', this.shell);
};

/**
 * Makes a remove request to the mongod instance on the backing server. On
 * success, the item(s) are removed from the collection, otherwise a failure
 * message is printed and an error is thrown.
 */
mongo.Coll.prototype.remove = function (constraint, justOne) {
  var url = this.urlBase + 'remove';
  var params = {constraint: constraint, just_one: justOne};
  mongo.request.makeRequest(url, params, 'DELETE', 'dbCollectionRemove', this.shell);
};

/**
 * Makes an update request to the mongod instance on the backing server. On
 * success, the item(s) are updated in the collection, otherwise a failure
 * message is printed and an error is thrown.
 *
 * Optionally, an object which specifies whether to perform an upsert and/or
 * a multiple update may be used instead of the individual upsert and multi
 * parameters.
 */
mongo.Coll.prototype.update = function (query, update, upsert, multi) {
  var url = this.urlBase + 'update';
  // handle options document for 2.2+
  if (typeof upsert === 'object'){
    if (multi !== undefined){
      var msg = 'Fourth argument must be empty when specifying upsert and multi with an object';
      this.shell.insertResponseLine('ERROR: ' + msg);
      console.error('dbCollectionUpdate fail: ' + msg);
      throw {message: 'dbCollectionUpdate: Syntax error'};
    }
    multi = upsert.multi;
    upsert = upsert.upsert;
  }

  var params = {query: query, update: update, upsert: !!upsert, multi: !!multi};
  mongo.request.makeRequest(url, params, 'PUT', 'dbCollectionUpdate', this.shell);
};

/**
 * Makes a drop request to the mongod instance on the backing server. On
 * success, the collection is dropped from the database, otherwise a failure
 * message is printed and an error is thrown.
 */
mongo.Coll.prototype.drop = function () {
  var url = this.urlBase + 'drop';
  mongo.request.makeRequest(url, null, 'DELETE', 'dbCollectionDrop', this.shell);
};

/**
 * Makes an aggregation request to the mongod instance on the backing server.
 * On success, the result of the aggregation is returned, otherwise a failure
 * message is printed and an error is thrown.
 */
mongo.Coll.prototype.aggregate = function(query){
  query = query || {};
  var url = this.urlBase + 'aggregate';
  var onSuccess = function(data){
    this.shell.insertResponseLine(mongo.util.stringifyQueryResult(data));
  }.bind(this);
  mongo.request.makeRequest(url, query, 'GET', 'dbCollectionAggregate', this.shell, onSuccess);
};
