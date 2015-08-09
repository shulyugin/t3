define(['model/AudioContext'], function (audioContext){

  function AudioFile (file){
    this.file = file;

    this.tags = $.Deferred();
    this.getTags();

    this.audioBuffer = $.Deferred();
  }

  AudioFile.prototype.getTags = function() {
    if(this.tags.state() === 'pending'){
      ID3.loadTags(this.file.name, function() {
        var tags = ID3.getAllTags(this.file.name);
        var image = tags.picture;
        if (image) {
          var base64String = "";
          for (var i = 0; i < image.data.length; i++) {
              base64String += String.fromCharCode(image.data[i]);
          }
          var base64 = "data:" + image.format + ";base64," + window.btoa(base64String);
        }
        this.tags.resolve({
          album: tags['album'],
          artist: tags['artist'],
          title: tags['title'],
          coverSrc: image? base64 : null
        });
      }.bind(this), {
        tags: ['title', 'artist', 'album', 'picture'],
        dataReader: FileAPIReader(this.file)
      });
    }
    return this.tags.promise();
  };

  AudioFile.prototype.getAudioBuffer = function() {
    if(this.audioBuffer.state() === 'pending') {
      var reader = new FileReader();
      reader.onload = function (e){
        var arrayBuffer = e.target.result;
        audioContext.decodeAudioData(arrayBuffer, function(audioBuffer) {
          this.audioBuffer.resolve(audioBuffer);
        }.bind(this));
      }.bind(this);
      reader.readAsArrayBuffer(this.file);
    }
    return this.audioBuffer.promise();
  };

  AudioFile.prototype.releaseAudioBuffer = function() {
    this.audioBuffer = $.Deferred();
  }

  return AudioFile;
});
