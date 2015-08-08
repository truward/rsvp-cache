/*
 * Caching utilities using rsvp promises.
 * The cache contract is as follows:
 * It should implement two functions - getValue(key, loadFn) and setValue(key, value)
 */

var rsvp = require('rsvp');


//
// Global Event Target 
//


// event names: cache miss and cache hit
var CACHE_MISS = "cacheMiss";
var CACHE_HIT = "cacheHit";

/** Global event target class */
function GlobalCacheEventTarget() {}
rsvp.EventTarget.mixin(GlobalCacheEventTarget.prototype);

var GLOBAL_EVENT_TARGET = new GlobalCacheEventTarget();

function on() {
  return GLOBAL_EVENT_TARGET.on.apply(GLOBAL_EVENT_TARGET, arguments);
}

function off() {
  return GLOBAL_EVENT_TARGET.off.apply(GLOBAL_EVENT_TARGET, arguments);
}


//
// Load function helper
//

/** Default function which will be used instead of loadFn in getValue method if loadFn is null or undefined */
function defaultLoadFn(key) {
  return new rsvp.Promise(function(resolve, reject) {
    reject(key);
  });
}

//
// Base class
//

function BaseCache() {
}

BaseCache.prototype._onCacheHit = function(key, value) {
  return GLOBAL_EVENT_TARGET.trigger(CACHE_HIT, {cache: this, key: key, value: value});
}

BaseCache.prototype._onCacheMiss = function(key) {
  return GLOBAL_EVENT_TARGET.trigger(CACHE_MISS, {cache: this, key: key});
}

//
// A cache which is always empty
//

function AlwaysEmptyCache() {
}

AlwaysEmptyCache.prototype.__proto__ = BaseCache.prototype;

AlwaysEmptyCache.prototype.getValue = function(key, loadFn) {
  var actualLoadFn = loadFn || defaultLoadFn;
  this._onCacheMiss(key);
  return actualLoadFn(key);
}

AlwaysEmptyCache.prototype.setValue = function(key, value) {
  // do nothing
}

AlwaysEmptyCache.prototype.deleteValue = function(key) {
  // do nothing
}

//
// A wrapper around standard javascript object
//

function SimpleObjectCache(cacheObject) {
  this.cacheObject = cacheObject || {};
}

SimpleObjectCache.prototype.__proto__ = BaseCache.prototype;

SimpleObjectCache.prototype.getValue = function(key, loadFn) {
  var actualLoadFn = loadFn || defaultLoadFn;

  var promise = new rsvp.Promise(function(resolve, reject) {
    if (this.cacheObject.hasOwnProperty(key)) {
      var value = this.cacheObject[key];
      this._onCacheHit(key, value);
      resolve(this.cacheObject[key]);
    } else {
      this._onCacheMiss(key);
      reject(key);
    }
  }.bind(this));

  if (loadFn) {
    // load function is defined - use it if promise failed to deliver value from the cache
    promise = promise.then(null, function valueNotFoundInCache(key) {
      var promise = actualLoadFn(key);

      // intercept value, returned by load function and put it into the cache
      promise.then(function valueLoadedFromCache(loadedValue) {
        this.setValue(key, loadedValue);
      }.bind(this));

      return promise;
    }.bind(this));
  }

  return promise;
}

SimpleObjectCache.prototype.setValue = function(key, value) {
  this.cacheObject[key] = value;
}

SimpleObjectCache.prototype.deleteValue = function(key) {
  if (this.cacheObject.hasOwnProperty(key)) {
    delete this.cacheObject[key];
  }
}

//
// Exports
//

module.exports.AlwaysEmptyCache = AlwaysEmptyCache;
module.exports.SimpleObjectCache = SimpleObjectCache;

// global event handlers
module.exports.CACHE_MISS = CACHE_MISS;
module.exports.CACHE_HIT = CACHE_HIT;
module.exports.on = on;
module.exports.off = off;

