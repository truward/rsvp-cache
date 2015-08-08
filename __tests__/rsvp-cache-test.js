
jest.dontMock('../rsvp-cache.js');
jest.dontMock('rsvp');

var cache = require('../rsvp-cache.js');
var rsvp = require('rsvp');

function createStaticLoadFn(value) {
  return function () {
    return new rsvp.Promise(function (resolve) {
      resolve(value);
    });
  }
}

describe('always empty cache', function () {

  it('should never return cached value', function () {
    // Given:
    var c = new cache.AlwaysEmptyCache();
    var holder = {
      catchTriggered: 'catch-not-triggered',
      thenTriggered: 'then-not-triggered'
    };

    // When:
    var promise = c.getValue('something');

    // Then:
    promise.then(function () {
      holder.thenTriggered = 'then-triggered';
    });
    promise.catch(function () {
      holder.catchTriggered = 'catch-triggered';
    });
    
    jest.runAllTimers();

    expect(holder.thenTriggered).toBe('then-not-triggered');
    expect(holder.catchTriggered).toBe('catch-triggered');
  });

  it('should use load function result', function () {
    // Given:
    var c = new cache.AlwaysEmptyCache();
    var holder = {val: 0};
    var value = 5;

    // When:
    var promise = c.getValue('something', createStaticLoadFn(value));
    
    // Then:
    promise.then(function (d) { holder.val = d; });

    jest.runAllTimers();

    expect(holder.val).toBe(value);
  });

  it('should generate cache miss event', function () {
    // Given:
    var holder = {instance: null, key: null};
    var cacheMissHandler = cache.on(cache.CACHE_MISS, function (evt) {
      holder.instance = evt.cache;
      holder.key = evt.key;
    });
    var actualKey = 'actualKey';
    var c = new cache.AlwaysEmptyCache();

    // When:
    c.getValue(actualKey);

    // Then:
    jest.runAllTimers();

    expect(holder.instance).toEqual(c);
    expect(holder.key).toBe(actualKey);
    cache.off(cache.CACHE_MISS, cacheMissHandler);
  });
});


describe('simple cache', function () {

  it('should load cached value', function () {
    // Given:
    var c = new cache.SimpleObjectCache();
    var key = 'key';
    var value = 1;
    c.setValue(key, value);
    var holder = {value: null};

    // When:
    promise = c.getValue(key);
   
    // Then:
    promise.then(function (d) { holder.value = d; });

    jest.runAllTimers();

    expect(holder.value).toBe(value);
  });

  it('should use load function if value not found', function () {
    // Given:
    var c = new cache.SimpleObjectCache();
    var key = 'key';
    var value = 1;
    var holder = {value: null};

    // When:
    promise = c.getValue(key, createStaticLoadFn(value));
   
    // Then:
    promise.then(function (d) { holder.value = d; });

    jest.runAllTimers();

    expect(holder.value).toBe(value);
  });

  it('should delete cached value', function () {
    // Given:
    var c = new cache.SimpleObjectCache();
    var key = 'key';
    var value = [1];
    c.setValue(key, value);
    c.deleteValue(key);
    var holder = {value: null, fail: null};

    // When:
    promise = c.getValue(key);
   
    // Then:
    promise.then(function () { holder.fail = 'Delete did not take an effect'; });
    var catchVal = 2;
    promise.catch(function () { holder.value = catchVal; });

    jest.runAllTimers();

    expect(holder.fail).toBe(null);
    expect(holder.value).toBe(catchVal);
  });
});

