$(function(){

  var CONTEXT = {
    "@context": {
      "@vocab": "http://ld.ipotables.net/schema#",
      "input": { "@type": "@id", "@container": "@set" },
      "output": { "@type": "@id", "@container": "@set" },
      "inputOf": { "@type": "@id", "@container": "@set" },
      "outputOf": { "@type": "@id", "@container": "@set" }
    }
  };

  var graph = levelgraphJSONLD(levelgraph('dev1'));

  function putResource(resource){
    if(!resource["@context"]) resource["@context"] = CONTEXT["@context"];
    return new Promise(function(resolve, reject){
      graph.jsonld.put(resource, function(err, doc){
        if(err) reject(err);
        resolve(doc);
      });
    });
  }

  function getResource(id){
    return new Promise(function(resolve, reject){
      graph.jsonld.get(id, CONTEXT, function(err, doc){
        if(err) reject(err);
        resolve(doc);
      });
    });
  }

  function delResource(id){
    return new Promise(function(resolve, reject){
      graph.jsonld.del(id, function(err){
        if(err) reject(err);
        resolve();
      });
    });
  }

  function getAllTriples(){
    return new Promise(function(resolve, reject){
      graph.get({}, function(err, list){
        if(err) reject(err);
        resolve(list);
      });
    });
  }

  function seed(data) {
    return new Promise(function(resolve, reject){
      Promise.all(_.map(data["@graph"], putResource)).then(function(){
        console.log('database seeded');
        resolve();
      }).catch(reject);
    });
  }

  function empty(){
    return new Promise(function(resolve, reject){
      getAllTriples().then(function(list){
        var ids = _.uniq(_.map(list, function(triple){ return triple.subject; }));
        Promise.all(_.map(ids, delResource)).then(function(){
          console.log('database emptied');
          resolve();
        }).catch(reject);
      }).catch(reject);
    });
  }

  function getAll(type){
    return new Promise(function(resolve, reject){
      graph.get({
        predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        object: "http://ld.ipotables.net/schema#" + type
      }, function(err, list){
        if(err) reject(err);
        var ids = _.map(list, function(triple){ return triple.subject; });
        Promise.all(_.map(ids, getResource)).then(function(all){
          console.log('got all of type:', type);
          resolve(all);
        });
      });
    });
  }

  graph.putResource = putResource;
  graph.getResource = getResource;
  graph.getAllTriples = getAllTriples;
  graph.seed = seed;
  graph.empty = empty;
  graph.getAll = getAll;

  var Module = Backbone.Model.extend({
    uuid: function(){
      return this.get('@id').replace('urn:uuid:', '');
    }
  });

  var Thing = Backbone.Model.extend({
    uuid: function(){
      return this.get('@id').replace('urn:uuid:', '');
    }
  });

  var ModulesList = Backbone.Collection.extend({
    model: Module
  });

  var ThingsList = Backbone.Collection.extend({
    model: Thing
  });

  var ModuleView = Backbone.View.extend({
    el: '#module',

    render: function(){
      this.$el.find('.process').html(this.model.get('process'));
      _.each(this.model.get('input'), function(uri){
        var thing = things.findWhere({ '@id': uri });
        this.$el.find('.input').append('<li><a href="#things/' + thing.uuid() + '">' + thing.get('name') + '</a></li>');
      }.bind(this));
      _.each(this.model.get('output'), function(uri){
        var thing = things.findWhere({ '@id': uri });
        this.$el.find('.output').append('<li><a href="#things/' + thing.uuid() + '">' + thing.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  var ThingView = Backbone.View.extend({
    el: '#thing',

    render: function(){
      _.each(this.model.get('inputOf'), function(uri){
        var mod = modules.findWhere({ '@id': uri });
        this.$el.find('.input').append('<li><a href="#modules/' + mod.uuid() + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
      _.each(this.model.get('outputOf'), function(uri){
        var mod = modules.findWhere({ '@id': uri });
        this.$el.find('.output').append('<li><a href="#modules/' + mod.uuid() + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  var ModulesListView = Backbone.View.extend({
    el: "#mlist",

    initialize: function(){
      _.bindAll(this, 'render');
      this.collection.on('reset', this.render);
    },

    render: function(){
      console.log('render list of modules');
      this.collection.each(function(mod){
        this.$el.append('<li><a href="#modules/' + mod.uuid() + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  var ThingsListView = Backbone.View.extend({
    el: "#tlist",

    initialize: function(){
      _.bindAll(this, 'render');
      this.collection.on('reset', this.render);
    },

    render: function(){
      console.log('render list of things');
      this.collection.each(function(thing){
        this.$el.append('<li><a href="#things/' + thing.uuid() + '">' + thing.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  function nameView(name){
    $('#header h2').html(name);
  }

  function setDescription(description){
    $('#header p').html(description);
  }

  function resetLists(){
    $('ul.input').empty();
    $('ul.process').empty();
    $('ul.output').empty();
  }

  var Router = Backbone.Router.extend({
    routes: {
      '': 'directory',
      'modules/:uuid': 'mod',
      'things/:uuid': 'thing'
    },

    directory: function(){
      resetLists();
      $('#directory').show();
      $('#module').hide();
      $('#thing').hide();
      nameView('directory');
      setDescription('');
    },

    mod: function(uuid){
      resetLists();
      $('#module').show();
      $('#directory').hide();
      $('#thing').hide();

      var mod = modules.findWhere({ '@id': 'urn:uuid:' + uuid });
      nameView('module: ' + mod.get('name'));
      setDescription(mod.get('description'));
      var view = new ModuleView({ model: mod });
      view.render();
    },

    thing: function(uuid){
      resetLists();
      $('#thing').show();
      $('#directory').hide();
      $('#module').hide();

      var thing = things.findWhere({ '@id': 'urn:uuid:' + uuid });
      nameView('thing: ' + thing.get('name'));
      setDescription(thing.get('description'));
      var view = new ThingView({ model: thing });
      view.render();
    }
  });

  // FIXME move to the end and provide proper storage!
  var modules = new ModulesList();
  var things = new ThingsList();

  var mView = new ModulesListView({ collection: modules });
  var tView = new ThingsListView({ collection: things });

  mView.render();
  tView.render();

  var router = new Router();
  Backbone.history.start(); // enable {pushState: true}

  router.navigate('', { trigger: true });

  // debug
  window.app = {
    CONTEXT: CONTEXT,
    graph: graph,
    modules: modules,
    mView: mView,
    tView: tView,
    things: things,
    router: router,
    log: function(data){ console.log(data); }
  };

  function init(){
    console.log('init');
    graph.getAll('Module').then(function(data){ modules.reset(data); });
    graph.getAll('Thing').then(function(data) { things.reset(data); });
  }

  $.get('data.jsonld', function(data){
    window.app.data = JSON.parse(data);
    graph.empty().then(function(){
      graph.seed(app.data).then(init);
    });
    console.log('retrieved data', app.data);
  });

  $('#header h1').on('click', function(){
    router.navigate('', { trigger: true });
  });

});
