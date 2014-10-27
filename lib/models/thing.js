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
    this.inputOf = [];
    this.outputOf = [];
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

Thing.prototype.getIO = function(type, callback) {
    // Activate for local debug
    var debug = true;

    if(!type) throw new Error('Need type to get a thing i/o relation');
    
    if(debug) console.log('Attempting to load ' + type + 's for thing ' + this.id);
    
    var query = [
        'MATCH (thing:Thing) <-[rel:' + type + ']- (module:Module)',
        'WHERE ID(thing) = {thingId}',
        'RETURN module',
    ].join('\n')

    var params = {
        thingId: this.id
    };

    var self = this;
    db.query(query, params, function (err, results) {
        if(err) callback(err);

        if(debug) console.log('Loaded ' + results.length + ' ' + type + 's for thing ' + self.id);

        callback(null, results);
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

