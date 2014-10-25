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
        'MATCH (module) -[rel:inputs]- (thing)',
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


Module.prototype.removeInput = function (thing, callback) {
    var query = [
        'MATCH (module:Module) -[rel:input]-> (thing:Module)',
        'WHERE ID(module) = {moduleId} AND ID(thing) = {thingId}',
        'DELETE rel',
    ].join('\n')

    var params = {
        moduleId: this.id,
        thingId: thing.id,
    };

    db.query(query, params, function (err) {
        callback(err);
    });
};

// static methods:

Module.get = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        callback(null, new Module(node));
    });
};

Module.getAll = function (callback) {
    var query = [
        'MATCH (module:Module)',
        'RETURN module',
    ].join('\n');

    db.query(query, null, function (err, results) {
        if (err) return callback(err);
        var modules = results.map(function (result) {
            return new Module(result['module']);
        });
        callback(null, modules);
    });
};

// creates the module and persists (saves) it to the db, incl. indexing it:
Module.create = function (data, callback) {
    var node = db.createNode(data);
    var module = new Module(node);

    var query = [
        'CREATE (module:Module {data})',
        'RETURN module',
    ].join('\n');

    var params = {
        data: data
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var module = new Module(results[0]['module']);
        callback(null, module);
    });
};
