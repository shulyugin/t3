define(['model/AudioContext', 'model/Playlist'], function (audioContext, Playlist){

  function Player (){
    this.playlist = new Playlist();

    // settings
    this.isPlaying = false;
    this.timing = {
      start: 0,
      end: 0,
      diff: 0
    };

    this.bindEvents();
  }

  Player.prototype.play = function() {
    if(this.isPlaying) {
      return;
    }
    this.source = audioContext.createBufferSource();
    this.source.connect(audioContext.destination);

    var current = this.playlist.getCurrent();
    if(current) {
      current.getAudioBuffer().then(function (audioBuffer){
        this.source.buffer = audioBuffer;
        this.source.start(0, this.timing.diff ? this.timing.diff : 0);
        var currentTime = audioContext.currentTime;
        this.timing.start = currentTime;
        this.timing.end = currentTime;
        this.isPlaying = true;
      }.bind(this));
    }
  };

  Player.prototype.pause = function() {
    if(!this.isPlaying) {
      return;
    }
    this.source.stop(0);
    this.timing.end = audioContext.currentTime;
    this.timing.diff += this.timing.end - this.timing.start;
    this.isPlaying = false;
  }

  Player.prototype.prev = function() {
    this.pause();
    this.timing = {
      start: 0,
      end: 0,
      diff: 0
    };
    this.playlist.prev();
    this.play();
  }

  Player.prototype.next = function() {
    this.pause();
    this.timing = {
      start: 0,
      end: 0,
      diff: 0
    };
    this.playlist.next();
    this.play();
  }

  Player.prototype.bindEvents = function() {
    $('#fileChooser').on('change', function (event){
      this.playlist.addFileList(event.target.files);
      this.play();
    }.bind(this));
  };

  return Player;
});
