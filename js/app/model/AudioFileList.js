define(['model/AudioFile'], function (AudioFile){

  function AudioFileList (){
    this.audioFiles = [];

    this.current;
    this.length = 0;

    // settings
    this.repeatAll = true;
    this.random = false;
  }

  AudioFileList.prototype.addFile = function (file){
    var fileExists = this.audioFiles.some(function (audioFile){
      return audioFile.file.name === file.name;
    });
    if(!fileExists){
      this.audioFiles.push(new AudioFile(file));
      return true;
    }
    return false;
  };

  AudioFileList.prototype.addFileList = function (files){
    if(files instanceof FileList) {
      files = Array.prototype.slice.apply(files);
    } else if(!(files instanceof Array)) {
      return;
    }
    files.forEach(function (file){
      this.addFile(file);
    }.bind(this));
  };

  AudioFileList.prototype.get = function(idx) {
    if(idx >= 0 && idx < this.audioFiles.length) {
      return this.audioFiles[idx];
    }
    return false;
  };

  AudioFileList.prototype.set = function(audioFile) {
    if(!(audioFile instanceof AudioFile) || this.indexOf(audioFile) == -1) {
      return false;
    }
    this.current = audioFile;
    return true;
  };

  AudioFileList.prototype.getCount = function() {
    return this.audioFiles.length;
  }

  AudioFileList.prototype.getCurrent = function() {
    if(!this.current && this.audioFiles.length > 0) {
      this.current = this.audioFiles[0];
    }
    return this.current || null;
  };

  AudioFileList.prototype.getLast = function() {
    if(this.audioFiles.length > 0) {
      return this.audioFiles[this.audioFiles.length - 1];
    }
  };

  AudioFileList.prototype.indexOf = function(audioFile) {
    return this.audioFiles.indexOf(audioFile);
  }

  AudioFileList.prototype.prev = function() {
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

  AudioFileList.prototype.next = function() {
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

  AudioFileList.fromFiles = function (files){
    var AudioFileList = new AudioFileList();
    AudioFileList.addFileList(files);
    return AudioFileList;
  };

  return AudioFileList;
});
