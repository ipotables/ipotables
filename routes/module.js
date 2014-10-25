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
  ThingModel.getByName(req.body.name, function(err, thing) {
    function errHandler(err,id) {
      console.log(err);
      res.render('module',{module:module, error: err})
    }
    if (err) return errHandler(err,req.params.id);
    var cb = function (err, thing) {
      ModuleModel.get(req.params.id, function(err, module) {
        if (err) return errHandler(err,req.params.id);
        module.addRelation(thing,type,function(err, result) {
          if (err) return errHandler(err,req.params.id);
          res.render('module',{module: module, flash: {message: req.params.type+" relation added to module "+module.name}});
        });
      });
    };
    if (!thing) {
      return Thing.create(req.body, cb);
    }
    cb(null,thing);
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
