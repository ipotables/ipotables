var express = require('express');
var router = express.Router();
var ModuleModel = require('../lib/models/module.js');
var ThingModel = require('../lib/models/thing.js');

/* GET modules page. */
router.get('/list', function(req, res) {
  ModuleModel.getAll(function(err, modules){
    res.render('modules', { result: modules });
  });
});

/* GET create module page. */
router.get('/create', function(req, res) {
  res.render('module_create');
});

/* GET create module page. */
router.post('/:id/add/:type', function(req, res) {
  
  // For local debug
  var debug = true;

  if(debug) console.log('Trying to add', req.params.type, 'relation to module.');

  ThingModel.getByName(req.body.name, function(err, thing) {
    
    function errHandler(err) {
      if(debug) console.log(err);
      res.render('error',{message:err.message, error: err})
    }

    if (err) return errHandler(err);

    // Callback
    var cb = function (err, theThing) {
      if (err) return errHandler(err);
      ModuleModel.get(req.params.id, function(err, module) {
        if (err) return errHandler(err);
        
        if(debug) console.log('Got module and thing, now trying to create relation', theThing);

        module.addRelation(theThing, req.params.type, function(err, result) {
          if (err) return errHandler(err);

          if(debug) console.log('Added', req.params.type, 'relation to module.');

          module[req.params.type + 's'].push(theThing);

          res.render('module',{ module: module, flash: {
            message: req.params.type + " relation added to module " + module.name
          }});
        }); // addRelation

      });
    };

    if (!thing) {
      if(debug) console.log('thing does not exist, creating...');
      return ThingModel.create(req.body, cb);
    }

    if(debug) console.log('got thing already existing');
    cb(null, thing);
  });
});

/* POST module */
router.post('/create', function(req, res) {
  ModuleModel.create(req.body, function(err, module){
    if(err){
      res.render('module_create', { error: err });
      return;
    }

    res.redirect('/module/' + module.id);
  });
});

/* GET module view page */
router.get('/:id', function(req, res) {
  ModuleModel.get(req.params.id, function(err, module){
    if(err) {
      // TODO: Use correct error page
      res.render('module_create', { error: err });
      return;
    }

    res.render('module', { module: module });

  });
});

module.exports = router;
