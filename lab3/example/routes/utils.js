'use strict';

const utils = {};

utils.getJson = function (ob) {
    if (ob instanceof String || typeof ob === "string") {
        const obTrim = ob.trim();
        if (obTrim.startsWith('{') || obTrim.startsWith('['))
            return JSON.parse(obTrim);
        return { warning: 'Expected JSON, received a plain string?', message: obTrim };
    }
    return ob;
};


module.exports = utils;
