requirejs.config({
  baseUrl: 'js/app'
});
requirejs(['controller/Player'], function (Player) {
  window.player = new Player();
});
