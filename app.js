$(function(){

  var CONTEXT = {
    "@context": {
      "@vocab": "http://ld.ipotables.net/context#",
      "input": { "@type": "@id" },
      "output": { "@type": "@id" },
      "inputOf": { "@type": "@id" },
      "outputOf": { "@type": "@id" }
    }
  };

  var graph = levelgraphJSONLD(levelgraph('dev'));

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

  graph.putResource = putResource;
  graph.getResource = getResource;
  graph.getAllTriples = getAllTriples;
  graph.seed = seed;
  graph.empty = empty;

  var Module = Backbone.Model.extend({
  });

  var Thing = Backbone.Model.extend({
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
      _.each(this.model.get('input'), function(uuid){
        var thing = things.findWhere({ uuid: uuid });
        this.$el.find('.input').append('<li><a href="#things/' + thing.get('uuid') + '">' + thing.get('name') + '</a></li>');
      }.bind(this));
      _.each(this.model.get('output'), function(uuid){
        var thing = things.findWhere({ uuid: uuid });
        this.$el.find('.output').append('<li><a href="#things/' + thing.get('uuid') + '">' + thing.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  var ThingView = Backbone.View.extend({
    el: '#thing',

    render: function(){
      _.each(this.model.get('inputOf'), function(uuid){
        var mod = modules.findWhere({ uuid: uuid });
        this.$el.find('.input').append('<li><a href="#modules/' + mod.get('uuid') + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
      _.each(this.model.get('outputOf'), function(uuid){
        var mod = modules.findWhere({ uuid: uuid });
        this.$el.find('.output').append('<li><a href="#modules/' + mod.get('uuid') + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  var ModulesListView = Backbone.View.extend({
    el: "#mlist",

    initialize: function(){
      this.on('reset', this.render);
    },

    render: function(){
      console.log('render list of modules');
      this.collection.each(function(mod){
        this.$el.append('<li><a href="#modules/' + mod.get('uuid') + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  var ThingsListView = Backbone.View.extend({
    el: "#tlist",

    initialize: function(){
      this.on('reset', this.render);
    },

    render: function(){
      console.log('render list of things');
      this.collection.each(function(thing){
        this.$el.append('<li><a href="#things/' + thing.get('uuid') + '">' + thing.get('name') + '</a></li>');
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

      var mod = modules.findWhere({ uuid: uuid });
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

      var thing = things.findWhere({ uuid: uuid });
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
    things: things,
    router: router,
    log: function(data){ console.log(data); }
  };

  $.get('data.jsonld', function(data){
    window.app.data = JSON.parse(data);
    graph.empty().then(function(){
      graph.seed(app.data);
    });
    console.log('retrieved data', app.data);
  });

  $('#header h1').on('click', function(){
    router.navigate('', { trigger: true });
  });

});
