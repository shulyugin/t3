define(['model/AudioFile'], function (AudioFile){

  function Playlist (){
    this.audioFiles = [];

    this.current;

    // settings
    this.repeatAll = true;
    this.random = false;
  }

  Playlist.prototype.addFile = function (file){
    var fileExists = this.audioFiles.some(function (audioFile){
      return audioFile.file.name === file.name;
    });
    if(!fileExists){
      this.audioFiles.push(new AudioFile(file));
    }
  };

  Playlist.prototype.addFileList = function (files){
    if(files instanceof FileList) {
      files = Array.prototype.slice.apply(files);
    } else if(!(files instanceof Array)) {
      return;
    }
    files.forEach(function (file){
      this.addFile(file);
    }.bind(this));
  };

  Playlist.prototype.getCurrent = function() {
    if(!this.current && this.audioFiles.length > 0) {
      this.current = this.audioFiles[0];
    }
    return this.current || null;
  };

  Playlist.prototype.prev = function() {
    if(!this.current) {
      return this.getCurrent();
    }
    var idx = this.audioFiles.indexOf(this.current);
    if(this.random) {

    } else if(idx - 1 < 0) {
      if(!this.repeatAll) {
        return this.current;
      }
      idx = this.audioFiles.length - 1;
    } else {
      idx = idx - 1;
    }
    this.current = this.audioFiles[idx];
    return this.current;
  };

  Playlist.prototype.next = function() {
    if(!this.current) {
      return this.getCurrent();
    }
    var idx = this.audioFiles.indexOf(this.current);
    if(this.random) {

    } else if(idx + 1 >= this.audioFiles.length) {
      if(!this.repeatAll) {
        return this.current;
      }
      idx = 0;
    } else {
      idx = idx + 1;
    }
    this.current = this.audioFiles[idx];
    return this.current;
  };

  Playlist.fromFiles = function (files){
    var playlist = new Playlist();
    playlist.addFileList(files);
    return playlist;
  };

  return Playlist;
});
