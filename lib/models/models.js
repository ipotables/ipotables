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

var Thing = {};
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