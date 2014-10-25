var async = require('async');
var neo4j = require('neo4j');
var util = require('util');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  async.waterfall([
  function (cb) {
    var query = [
        'MATCH (n:Thing)',
        'RETURN n',
    ].join('\n');

    db.query(query, null, function (err, result) {
        if (err) return cb(err);
        cb(null, result);
    });
    }],
    function (err,result) {
      if (err) {
          return console.error('Error saving new node to database:', err);
      }
      res.send('respond with a resource:'+JSON.stringify(result));
  });
});

/* GET users listing. */
router.post('/add', function(req, res) {
  async.waterfall([
  function (cb) {
      var properties = {
      name: req.body.name,
      description: req.body.description }
      var query = [
          'CREATE (n:Thing {properties})',
          'RETURN n',
      ].join('\n');
      console.log('req.body:'+util.inspect(req.body));
      console.log('query: '+query);

      db.query(query, {properties: properties}, function (err, result) {
          if (err) return cb(err);
          cb(null, result);
      });

      /*var node = db.createNode(n:Thing {
      name: req.body.name,
      description: req.body.description });     // instantaneous, but...
      node.save(function (err, node) {    // ...this is what actually persists.
        if (err) {
            cb(err);
        } else {
            cb(null,node);
        }
    });*/
  }], function (err,result) {
    if (err) {
        return console.error('Error saving new node to database:', err);
    }
    res.send('saved with name: '+result[0].name);
  });
});

module.exports = router;
