var express = require('express');
var router = express.Router();
var Module = require('../lib/models/models.js').Module;
var Thing = require('../lib/models/models.js').Thing;

/* GET modules page. */
router.get('/search', function(req, res) {
  var debug = true;

  // TODO: Filter query string
  Thing.search(req.query.q, function(err, things){
    if(err){
      if(debug) console.log('Thing Search Error: ', err);
      res.json({ error: err });
      return;      
    }

    if(debug) console.log('Thing Results: ', things);
    if(debug) console.log('Thing First Result: ', things[0]);

    var results = {}

    // Reduce things db result to json data
    if(things){
      results.things = things.map(function(result){
        var thing = result.thing._data.data;
        thing.id = result.thing._data.metadata.id
        return thing;
      });
    }

    Module.search(req.query.q, function(err, modules){
      if(err){
        if(debug) console.log('Module Search Error: ', err);
        res.json({ error: err });
        return;      
      }

      if(debug) console.log('Module Results: ', modules);

      // Reduce modules db result to json data
      if(modules){
        results.modules = modules.map(function(result){
          var module = result.module._data.data;
          module.id = result.module._data.metadata.id
          return module;
        });
      }

      res.json(results);
    }, true);

  }, true);
});


module.exports = router;
