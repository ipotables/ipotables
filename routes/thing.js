var express = require('express');
var router = express.Router();
var Module = require('../lib/models/models.js').Module;
var Thing = require('../lib/models/models.js').Thing;

/* GET things page. */
router.get('/list', function(req, res) {
  Thing.getAll(function(err, things){
    res.render('things', { result: things });
  });
});

// DEACTIVATED:
// Thing can only be created in a module when directly establishing a relation
// /* GET create thing page. */
// router.get('/create', function(req, res) {
//   res.render('thing_create');
// });

// /* POST thing */
// router.post('/create', function(req, res) {
//   Thing.create(req.body, function(err, thing){
//     if(err){
//       res.render('thing_create', { error: err });
//       return;
//     }

//     res.redirect('/thing/' + thing.id);
//   });
// });

/* GET thing view page */
router.get('/:id', function(req, res) {
  Thing.get(req.params.id, function(err, thing){

    if(err) {
      res.render('error', { message: err.message, error: err });
      return;
    }

    res.render('thing', { thing: thing });  

  });
});

module.exports = router;
