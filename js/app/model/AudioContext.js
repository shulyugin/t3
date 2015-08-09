define([], function (){
  return new AudioContext() || new webkitAudioContext();
});
