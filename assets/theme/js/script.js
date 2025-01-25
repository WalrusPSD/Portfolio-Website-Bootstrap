var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.ASSUME_ES5 = false;
$jscomp.ASSUME_NO_NATIVE_MAP = false;
$jscomp.ASSUME_NO_NATIVE_SET = false;
$jscomp.SIMPLE_FROUND_POLYFILL = false;

$jscomp.defineProperty = $jscomp.ASSUME_ES5 || typeof Object.defineProperties === 'function'
    ? Object.defineProperty
    : function(obj, prop, descriptor) {
        if (obj !== Array.prototype && obj !== Object.prototype) {
            obj[prop] = descriptor.value;
        }
    };

$jscomp.getGlobal = function(globalObj) {
    return typeof window !== 'undefined' && window === globalObj
        ? globalObj
        : typeof global !== 'undefined' && global != null
        ? global
        : globalObj;
};

$jscomp.global = $jscomp.getGlobal(this);

$jscomp.polyfill = function(name, polyfillFunc, optVersion, targetVersion) {
    if (polyfillFunc) {
        let globalObj = $jscomp.global;
        let parts = name.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
            let part = parts[i];
            if (!(part in globalObj)) {
                globalObj[part] = {};
            }
            globalObj = globalObj[part];
        }
        let finalPart = parts[parts.length - 1];
        let current = globalObj[finalPart];
        let polyfill = polyfillFunc(current);
        if (polyfill !== current && polyfill != null) {
            $jscomp.defineProperty(globalObj, finalPart, {
                configurable: true,
                writable: true,
                value: polyfill,
            });
        }
    }
};

// Polyfill: Array.from
$jscomp.polyfill(
    'Array.from',
    function(original) {
        return original
            ? original
            : function(arrayLike, mapFn, thisArg) {
                  mapFn = mapFn != null ? mapFn : function(item) { return item; };
                  let result = [];
                  let iterator = typeof Symbol !== 'undefined' && Symbol.iterator && arrayLike[Symbol.iterator];
                  if (typeof iterator === 'function') {
                      let iteratorResult = iterator.call(arrayLike);
                      let index = 0;
                      while (!(iteratorResult = iterator.next()).done) {
                          result.push(mapFn.call(thisArg, iteratorResult.value, index++));
                      }
                  } else {
                      for (let i = 0; i < arrayLike.length; i++) {
                          result.push(mapFn.call(thisArg, arrayLike[i], i));
                      }
                  }
                  return result;
              };
    },
    'es6',
    'es3'
);

// Polyfill: Object.values
$jscomp.polyfill(
    'Object.values',
    function(original) {
        return original
            ? original
            : function(obj) {
                  let values = [];
                  for (let key in obj) {
                      if ($jscomp.owns(obj, key)) {
                          values.push(obj[key]);
                      }
                  }
                  return values;
              };
    },
    'es8',
    'es3'
);

$jscomp.owns = function(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
};

// Polyfill: Array.prototype.find
$jscomp.polyfill(
    'Array.prototype.find',
    function(original) {
        return original
            ? original
            : function(predicate, thisArg) {
                  let result = $jscomp.findInternal(this, predicate, thisArg);
                  return result.v;
              };
    },
    'es6',
    'es3'
);

$jscomp.checkStringArgs = function(obj, searchValue, methodName) {
    if (obj == null) {
        throw new TypeError(
            "The 'this' value for String.prototype." + methodName + " must not be null or undefined"
        );
    }
    if (searchValue instanceof RegExp) {
        throw new TypeError(
            "First argument to String.prototype." + methodName + " must not be a regular expression"
        );
    }
    return String(obj);
};

// Polyfill: String.prototype.startsWith
$jscomp.polyfill(
    'String.prototype.startsWith',
    function(original) {
        return original
            ? original
            : function(searchString, position) {
                  let str = $jscomp.checkStringArgs(this, searchString, 'startsWith');
                  searchString = String(searchString);
                  let startIndex = Math.max(0, Math.min(position | 0, str.length));
                  for (let i = 0; i < searchString.length && startIndex < str.length; i++, startIndex++) {
                      if (str[startIndex] !== searchString[i]) {
                          return false;
                      }
                  }
                  return true;
              };
    },
    'es6',
    'es3'
);

// Polyfill: Object.is
$jscomp.polyfill(
    'Object.is',
    function(original) {
        return original
            ? original
            : function(value1, value2) {
                  if (value1 === value2) {
                      return value1 !== 0 || 1 / value1 === 1 / value2;
                  }
                  return value1 !== value1 && value2 !== value2;
              };
    },
    'es6',
    'es3'
);

// Polyfill: Array.prototype.includes
$jscomp.polyfill(
    'Array.prototype.includes',
    function(original) {
        return original
            ? original
            : function(searchElement, fromIndex) {
                  let array = this;
                  if (array instanceof String) {
                      array = String(array);
                  }
                  let length = array.length;
                  fromIndex = fromIndex || 0;
                  if (fromIndex < 0) {
                      fromIndex = Math.max(fromIndex + length, 0);
                  }
                  for (; fromIndex < length; fromIndex++) {
                      let element = array[fromIndex];
                      if (element === searchElement || Object.is(element, searchElement)) {
                          return true;
                      }
                  }
                  return false;
              };
    },
    'es7',
    'es3'
);

// Polyfill: String.prototype.includes
$jscomp.polyfill(
    'String.prototype.includes',
    function(original) {
        return original
            ? original
            : function(searchString, position) {
                  return (
                      $jscomp.checkStringArgs(this, searchString, 'includes').indexOf(
                          searchString,
                          position || 0
                      ) !== -1
                  );
              };
    },
    'es6',
    'es3'
);

// Utility: Find Internal
$jscomp.findInternal = function(array, predicate, thisArg) {
    array = array instanceof String ? String(array) : array;
    for (let i = 0; i < array.length; i++) {
        let element = array[i];
        if (predicate.call(thisArg, element, i, array)) {
            return { i: i, v: element };
        }
    }
    return { i: -1, v: undefined };
};
