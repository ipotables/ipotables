var express = require('express');
var router = express.Router();
var ModuleModel = require('../lib/models/module.js');

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
