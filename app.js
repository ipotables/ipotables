$(function(){


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
    model: Module,
    el: '#module'
  });

  var ThingView = Backbone.View.extend({
    model: Thing,
    el: '#thing'
  });

  var ModulesListView = Backbone.View.extend({
    el: "#mlist",

    render: function(){
      this.collection.each(function(mod){
        this.$el.append('<li><a href="#modules/' + mod.get('uuid') + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
    }
  });

  var ThingsListView = Backbone.View.extend({
    el: "#tlist",

    render: function(){
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

  // FIXME move to the end and provide proper storage!
  var modules = new ModulesList();
  var things = new ThingsList();

  modules.add({
    name: 'making coffee',
    description: 'this module explains how to make coffe so you do not fall asleep',
    uuid: '042fbbdf-5276-4ab4-b59b-daee35b6db31'
  });
  things.add({
    name: 'coffee powder',
    description: 'coffee beans do not make best coffee if used in their original form, powder works much better for brewing',
    uuid: '5bc1633a-bf5b-4ae6-bf63-e04e654d42b3'
  });

  var Router = Backbone.Router.extend({
    routes: {
      '': 'directory',
      'modules/:uuid': 'mod',
      'things/:uuid': 'thing'
    },

    directory: function(){
      $('#directory').show();
      $('#module').hide();
      $('#thing').hide();
      nameView('directory');
      setDescription('');
    },

    mod: function(uuid){
      $('#module').show();
      $('#directory').hide();
      $('#thing').hide();

      var mod = modules.findWhere({ uuid: uuid });
      nameView('module: ' + mod.get('name'));
      setDescription(mod.get('description'));
    },

    thing: function(uuid){
      $('#thing').show();
      $('#directory').hide();
      $('#module').hide();

      var thing = things.findWhere({ uuid: uuid });
      nameView('thing: ' + thing.get('name'));
      setDescription(thing.get('description'));
    }
  });

  var mView = new ModulesListView({ collection: modules });
  var tView = new ThingsListView({ collection: things });

  mView.render();
  tView.render();

  var router = new Router();
  Backbone.history.start(); // enable {pushState: true}

  router.navigate('', { trigger: true });


  $('#header h1').on('click', function(){
    router.navigate('', { trigger: true });
  });

  // debug
  window.app = {
    modules: modules,
    things: things,
    router: router
  };

});
