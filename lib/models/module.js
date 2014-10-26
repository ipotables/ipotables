// module.js
// Module model logic.

var neo4j = require('neo4j');

var db = new neo4j.GraphDatabase(
    process.env['NEO4J_URL'] ||
    process.env['GRAPHENEDB_URL'] ||
    'http://localhost:7474'
);

// private constructor:

var Module = module.exports = function Module(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
    this.inputs = [];
    this.outputs = [];   
}

// public instance properties:

Object.defineProperty(Module.prototype, 'id', {
    get: function () { return this._node.id; }
});

Object.defineProperty(Module.prototype, 'name', {
    get: function () {
        return this._node.data['name'];
    },
    set: function (name) {
        this._node.data['name'] = name;
    }
});

Object.defineProperty(Module.prototype, 'description', {
    get: function () {
        return this._node.data['description'];
    },
    set: function (description) {
        this._node.data['description'] = description;
    }
});

Object.defineProperty(Module.prototype, 'process', {
    get: function () {
        return this._node.data['process'];
    },
    set: function (process) {
        this._node.data['process'] = process;
    }
});

// public instance methods:

Module.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Module.prototype.del = function (callback) {
    var query = [
        'MATCH (module:Module)',
        'WHERE ID(module) = {moduleId}',
        'DELETE module',
        'WITH thing',
        'MATCH (module) -[rel:input]- (thing) OR (module) -[rel:output]- (thing)',
        'DELETE rel',
    ].join('\n')

    var params = {
        moduleId: this.id
    };

    db.query(query, params, function (err) {
        callback(err);
    });
};

Module.prototype.addRelation = function (thing, type, callback) {
    this._node.createRelationshipTo(thing._node, type, {}, function (err, rel) {
        callback(err);
    });
};

Module.prototype.getIO = function(type, callback) {
    if(!type) throw new Error('Need type to get a module i/o relation');
    var query = [
        'MATCH (module:Module) -[rel:' + type + ']-> (thing:Thing)',
        'WHERE ID(module) = {moduleId}',
        'RETURN thing',
    ].join('\n')

    var params = {
        moduleId: this.id
    };

    db.query(query, params, function (err, results) {
        if(err) callback(err);
        callback(null, results);
    });
};

// static methods: