requirejs.config({
  baseUrl: 'js/app'
});
requirejs(['controller/Player'], function (player) {
  window.player = player;
});
