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

  // FIXME move to the end and provide proper storage!
  var modules = new ModulesList();
  var things = new ThingsList();

  modules.add({ name: 'making coffee', uuid: '042fbbdf-5276-4ab4-b59b-daee35b6db31' });
  things.add({ name: 'coffee powder', uuid: '5bc1633a-bf5b-4ae6-bf63-e04e654d42b3' });

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
    },

    mod: function(uuid){
      $('#module').show();
      $('#directory').hide();
      $('#thing').hide();

      var mod = modules.findWhere({ uuid: uuid });
      nameView('module: ' + mod.get('name'));
    },

    thing: function(uuid){
      $('#thing').show();
      $('#directory').hide();
      $('#module').hide();

      var thing = things.findWhere({ uuid: uuid });
      nameView('thing: ' + thing.get('name'));
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
