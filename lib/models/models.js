var ThingModel = require('./thing.js');
var ModuleModel = require('./module.js');
var neo4j = require('neo4j');

var db = new neo4j.GraphDatabase(
    process.env['NEO4J_URL'] ||
    process.env['GRAPHENEDB_URL'] ||
    'http://localhost:7474'
);

var Module = {};
Module.get = function (id, callback) {
    var debug = true;
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        var module = new ModuleModel(node);
        // TODO: Load input/output relations, 
        //  create ThingModels and add them to this.input/this.output
        module.getIO('input', function(err, results){
            if (err) return callback(err);
            if(debug) console.log('Got inputs for module:', results);
            if(results){
                for(var i = 0; i < results.length; ++i){
                    module.inputs.push(new ThingModel(results[i]['thing']));
                }
            }
            module.getIO('output', function(err, results){
                if (err) return callback(err);
                if(debug) console.log('Got outputs for module:', results);
                if(results){
                    for(var i = 0; i < results.length; ++i){
                        module.outputs.push(
                            new ThingModel(results[i]['thing'])
                        );
                    }
                }
                callback(null, module);
            });
        });
    });
};

Module.search = function (qstr, callback, plain) {
    var query = [
        'MATCH (module:Module)',
        'WHERE module.name=~{name}',
        'RETURN module',
    ].join('\n')

    var params = {
        name: '.*' + qstr + '.*'
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        if(results.length == 0){
            // None found
            callback(null, null);
            return;
        }
        if(plain){
            callback(null, results); 
            return;
        }
        var things = results.map(function (result) {
        return new ModuleModel(result['module']);
        });
        callback(null, things);    
        
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
            return new ModuleModel(result['module']);
        });
        callback(null, modules);
    });
};

// creates the module and persists (saves) it to the db, incl. indexing it:
Module.create = function (data, callback) {
    var node = db.createNode(data);
    //var module = new ModuleModel(node);

    var query = [
        'CREATE (module:Module {data})',
        'RETURN module',
    ].join('\n');

    var params = {
        data: data
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var module = new ModuleModel(results[0]['module']);
        callback(null, module);
    });
};

// Edits the module 
Module.edit = function (moduleId, data, callback) {
    var query = [
        'MATCH (n)',
        'WHERE ID(n) = {moduleId}',
        'SET n.name = {name}',
        'SET n.description = {description}',
        'SET n.process = {process}'
    ].join('\n');

    var params = {
        moduleId: parseInt(moduleId, 10),
        name: data.name,
        description: data.description,
        process: data.process,
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        callback(null);
    });
};

Module.removeIO = function (type, moduleId, thingId, callback) {
    var debug = true;

    var query = [
        'MATCH (module:Module) -[rel:' + type + ']-> (thing:Thing)',
        'WHERE ID(module) = {moduleId} AND ID(thing) = {thingId}',
        'DELETE rel'
    ].join('\n')

    var params = {
        moduleId: parseInt(moduleId, 10),
        thingId: parseInt(thingId, 10)
    };

    db.query(query, params, function (err) {
        if(err){
            callback(err);
            return;
        }

        Thing.numRelations(thingId, function(err, num){
            
            if(num < 1){
                if(debug) console.log('Thing has no relations anymore, remove it.');
                Thing.remove(thingId, callback);
                return;   
            }

            callback(err);
        });

        
    });
};

var Thing = {};

Thing.numRelations = function(tid, callback){
     var query = [
        'MATCH (thing:Thing) -[rel:input|:output]-m',
        'WHERE ID(thing) = {thingId}',
        'RETURN count(rel)',
    ].join('\n')

    var params = {
        thingId: parseInt(tid, 10),
    };

    db.query(query, params, function (err, result) {
        callback(err, result[0]['count(rel)']);
    });
}

Thing.remove = function(tid, callback){
     var query = [
        'MATCH (thing:Thing)',
        'WHERE ID(thing) = {thingId}',
        'DELETE thing',
    ].join('\n')

    var params = {
        thingId: parseInt(tid, 10),
    };

    db.query(query, params, function (err) {
        callback(err);
    });
}

Thing.get = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);

        var thing = new ThingModel(node);

        thing.getIO('input', function(err, results){
        if(err) return callback(err);

        for(var i = 0; i < results.length; ++i){
            thing.inputOf.push(new ModuleModel(results[i]['module']));
        }

        thing.getIO('output', function(err, results){
            if(err) return callback(err);

            for(var i = 0; i < results.length; ++i){
                thing.outputOf.push(new ModuleModel(results[i]['module']));
            }

            callback(null, thing);
        });
    });
    });
};

Thing.getByName = function (name, callback) {
    var query = [
        'MATCH (thing:Thing)',
        'WHERE thing.name={name}',
        'RETURN thing',
    ].join('\n')

    var params = {
        name: name
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        if(results.length == 0){
          // None found
          callback(null, null);
          return;
        }
        callback(null, new ThingModel(results[0]['thing']));
    });
};

Thing.search = function (qstr, callback, plain) {
    var query = [
        'MATCH (thing:Thing)',
        'WHERE thing.name=~{name}',
        'RETURN thing',
    ].join('\n')

    var params = {
        name: '.*' + qstr + '.*'
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        if(results.length == 0){
            // None found
            callback(null, null);
            return;
        }
        if(plain){
            callback(null, results); 
            return;
        }
        var things = results.map(function (result) {
            return new ThingModel(result['thing']);
        });
        callback(null, things);    
        
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
            return new ThingModel(result['thing']);
        });
        callback(null, things);
    });
};

// creates the thing and persists (saves) it to the db, incl. indexing it:
Thing.create = function (data, callback) {
    var node = db.createNode(data);
    //var thing = new ThingModel(node);

    var query = [
        'CREATE (thing:Thing {data})',
        'RETURN thing',
    ].join('\n');

    var params = {
        data: data
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var thing = new ThingModel(results[0]['thing']);
        callback(null, thing);
    });
};

exports.ThingModel = ThingModel;
exports.ModuleModel = ModuleModel;
exports.Thing = Thing;
exports.Module = Module;
