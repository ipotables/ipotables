// thing.js
// Thing model logic.

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(
    process.env['NEO4J_URL'] ||
    process.env['GRAPHENEDB_URL'] ||
    'http://localhost:7474'
);

// private constructor:

var Thing = module.exports = function Thing(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

Object.defineProperty(Thing.prototype, 'id', {
    get: function () { return this._node.id; }
});

Object.defineProperty(Thing.prototype, 'name', {
    get: function () {
        return this._node.data['name'];
    },
    set: function (name) {
        this._node.data['name'] = name;
    }
});

Object.defineProperty(Thing.prototype, 'description', {
    get: function () {
        return this._node.data['description'];
    },
    set: function (description) {
        this._node.data['description'] = description;
    }
});

// public instance methods:

Thing.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Thing.prototype.del = function (callback) {
    var query = [
        'MATCH (thing:Thing)',
        'WHERE ID(thing) = {thingId}',
        'DELETE thing',
        'WITH thing',
        'MATCH (thing) -[rel:inputs]- (thing)',
        'DELETE rel',
    ].join('\n')

    var params = {
        thingId: this.id
    };

    db.query(query, params, function (err) {
        callback(err);
    });
};

Thing.prototype.addInput = function (other, callback) {
    this._node.createRelationshipTo(other._node, 'inputs', {}, function (err, rel) {
        callback(err);
    });
};

Thing.prototype.removeInput = function (thing, callback) {
    var query = [
        'MATCH (thing:Thing) -[rel:inputs]-> (thing:Thing)',
        'WHERE ID(thing) = {thingId} AND ID(thing) = {thingId}',
        'DELETE rel',
    ].join('\n')

    var params = {
        thingId: this.id,
        thingId: thing.id,
    };

    db.query(query, params, function (err) {
        callback(err);
    });
};

// static methods:

Thing.get = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        callback(null, new Thing(node));
    });
};

Thing.getByName = function (name, callback) {
    db.getNodeByName(name, function (err, node) {
        if (err) return callback(err);
        callback(null, new Thing(node));
    });
};

Thing.getAll = function (callback) {
    var query = [
        'MATCH (thing:Thing)',
        'RETURN thing',
    ].join('\n');

    db.query(query, null, function (err, results) {
        if (err) return callback(err);
        var things = results.map(function (result) {
            return new Thing(result['thing']);
        });
        callback(null, things);
    });
};

// creates the thing and persists (saves) it to the db, incl. indexing it:
Thing.create = function (data, callback) {
    var node = db.createNode(data);
    var thing = new Thing(node);

    var query = [
        'CREATE (thing:Thing {data})',
        'RETURN thing',
    ].join('\n');

    var params = {
        data: data
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var thing = new Thing(results[0]['thing']);
        callback(null, thing);
    });
};
