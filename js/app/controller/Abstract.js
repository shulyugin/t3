define([], function (){
  function AbstractController() {

  }

  AbstractController.prototype.getTemplate = (function() {
    var promises = [];
    return function(url) {
      if(!promises[url]) {
        promises[url] = $.Deferred();
      }
      if(promises[url].state()  === 'pending') {
        $.get(url).then(function(tpl) {
          promises[url].resolve(tpl);
        });
      }
      return promises[url].promise();
    };
  })();

  return AbstractController;
});
