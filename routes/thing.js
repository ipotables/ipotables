var express = require('express');
var router = express.Router();
var ThingModel = require('../lib/models/thing.js');

/* GET things page. */
router.get('/list', function(req, res) {
  ThingModel.getAll(function(err, things){
    res.render('things', { result: things });
  });
});

/* GET create thing page. */
router.get('/create', function(req, res) {
  res.render('thing_create');
});

/* POST thing */
router.post('/create', function(req, res) {
  ThingModel.create(req.body, function(err, thing){
    if(err){
      res.render('thing_create', { error: err });
      return;
    }

    res.redirect('/thing/' + thing.id);
  });
});

/* GET thing view page */
router.get('/:id', function(req, res) {
  ThingModel.get(req.params.id, function(err, thing){
    if(err) {
      // TODO: Use correct error page
      res.render('thing_create', { error: err });
      return;
    }

    res.render('thing', { thing: thing });

  });
});

module.exports = router;
