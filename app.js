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

  // FIXME move to the end and provide proper storage!
  var modules = new ModulesList();
  var things = new ThingsList();

  things.add({
    name: 'coffee powder',
    description: 'coffee beans do not make best coffee if used in their original form, powder works much better for brewing',
    uuid: '5bc1633a-bf5b-4ae6-bf63-e04e654d42b3',
    asInput: ['042fbbdf-5276-4ab4-b59b-daee35b6db31']
  });

  things.add({
    name: 'coffee grounds',
    description: 'after brewing coffee using powder, we get grounds which still contain some nutritions',
    uuid: 'd0027b57-b6dd-44f7-af63-6811e1526507',
    asOutput: ['042fbbdf-5276-4ab4-b59b-daee35b6db31']
  });

  modules.add({
    name: 'making coffee',
    description: 'this module explains how to make coffe so you do not fall asleep',
    uuid: '042fbbdf-5276-4ab4-b59b-daee35b6db31',
    input: ['5bc1633a-bf5b-4ae6-bf63-e04e654d42b3'],
    output: ['d0027b57-b6dd-44f7-af63-6811e1526507']
  });


  var ModuleView = Backbone.View.extend({
    el: '#module',

    render: function(){
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
      _.each(this.model.get('asInput'), function(uuid){
        var mod = modules.findWhere({ uuid: uuid });
        this.$el.find('.input').append('<li><a href="#modules/' + mod.get('uuid') + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
      _.each(this.model.get('asOutput'), function(uuid){
        var mod = modules.findWhere({ uuid: uuid });
        this.$el.find('.output').append('<li><a href="#modules/' + mod.get('uuid') + '">' + mod.get('name') + '</a></li>');
      }.bind(this));
    }
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
