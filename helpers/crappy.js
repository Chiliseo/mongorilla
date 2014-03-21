/*
 * crappy helpers.
 * TODO Refactor - this is a bag of separate functions
 */

var _ = require('underscore');

exports.stringify = function (obj) {
    var nobj = _(obj).clone();
    nobj = objToStringJS(nobj);
    var str = JSON.stringify(nobj);
    str = str.replace(/"__js:([^"]*)"/g, '$1');
    return str;
};

exports.url = function(options) {
    console.log('Unbale to create URL:', options);
    return '/';
};

/**
 * Takes a nested object and returns a shallow object keyed with the path names
 * e.g. { "level1.level2": "value" }
 *
 * @param  {Object}      Nested object e.g. { level1: { level2: 'value' } }
 * @return {Object}      Shallow object with path names e.g. { 'level1.level2': 'value' }
 */
// taken from https://github.com/powmedia/backbone-deep-model/blob/master/distribution/deep-model.js
function objToPaths(obj) {
    var ret = {},
        separator = '.';

    for (var key in obj) {
        var val = obj[key];

        if (val && val.constructor === Object && !_.isEmpty(val)) {
            //Recursion for embedded objects
            var obj2 = objToPaths(val);

            for (var key2 in obj2) {
                var val2 = obj2[key2];

                ret[key + separator + key2] = val2;
            }
        } else {
            ret[key] = val;
        }
    }

    return ret;
}

exports.toFlat = function (obj) {
    return objToPaths(obj);
};



// parse json to js, eg. { someregexp: { "__constructor": "RegExp", "__arguments": ["^.*$", "g"] }}
function objToJS__construct(constructor, args) {
    function F() {
        return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
}

function objToStringJS(obj) {

    if (obj.__constructor) {
        return '__js:'+objToJS__construct(global[obj.__constructor], obj.__arguments||[]).toString();
    }

    for (var key in obj) {
        var val = obj[key];

        if (val && (val.constructor === Object || val.constructor === Array) && !_.isEmpty(val)) {
            //Recursion for embedded objects
            obj[key] = objToStringJS(val);
        }
    }

    return obj;
}

function objToJS(obj, map) {

    if (obj.__constructor) {
        return objToJS__construct(
            global[obj.__constructor],
            'function' === typeof map ? _(obj.__arguments||[]).map(map) : obj.__arguments||[]
        );
    }

    for (var key in obj) {
        var val = obj[key];

        if (val && (val.constructor === Object || val.constructor === Array) && !_.isEmpty(val)) {
            //Recursion for embedded objects
            obj[key] = objToJS(val, map);
        }
    }

    return obj;
}

// WARNING: use _().clone() before calling this against a config object
exports.toJS = function (obj, map) {
    return objToJS(obj, map);
};

// has sessionUser permission over a certain collection?
exports.hasPermission = function (sessionUser, collectionName, crudActions) {
    var _ = require('underscore');
    // crudActions must be a string: eg. "r", "c", or "cr"
    return sessionUser && sessionUser.roles && _(sessionUser.roles).any(function (roleName, i) {
        return _(global.config.roles).find(function (role) {
            return role.name === roleName 
                && _(crudActions.split()).all(function (crudAction) {
                        return !!~(role.permissions[collectionName]||'').indexOf(crudAction);
                    });
        });
    });
};