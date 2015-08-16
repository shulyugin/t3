define([], function (){
  return typeof AudioContext !== 'undefined' ? new AudioContext() : new webkitAudioContext();
});
