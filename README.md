RSVP Cache
==========

# Overview

RSVP Cache is a lightweight library that provides an access to various caching mechanisms using [rsvp](https://github.com/tildeio/rsvp.js) Promises.

Published module can be found in npm repository, latest stable version is available [here](https://www.npmjs.com/package/rsvp-cache).

# Simple Usage Sample

```js
var cache = require('rsvp-cache');

var simpleCache = new cache.SimpleObjectCache();
simpleCache.setValue('key, value');

var promise = simpleCache.getValue('key', function () {
  // load function - lengthy calculation/loading process...
  heavyLoadPromise = ajax.request('POST', '/make/lots/calculations');
  return heavyLoadPromise;
});

promise.then(function (data) {
  console.log(data); // prints 'value' as it was cached on the line with setValue above
});
```

Including in your ``package.json``:

```
  "devDependencies": {
...
    "rsvp-ajax": "^1.0.0",
...
  },
```


