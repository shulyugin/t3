define(['model/AudioContext', 'model/Playlist', 'model/AudioFile'
], function (audioContext, Playlist, AudioFile){

  function Player (){
    this.$node = $('#player');
    this.playlist = new Playlist();

    // settings
    this.isPlaying = false;

    this.analyser = audioContext.createAnalyser();
    this.analyser.minDecibels = -140;
    this.analyser.maxDecibels = 0;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.fftSize = 2048;

    this.frequencyCanvas = document.getElementById('frequency');
    this.freqs = new Uint8Array(this.analyser.frequencyBinCount);

    this.gain = audioContext.createGain();
    this.gain.gain.value = 0.69;

    // visualisation
    this.analyser.connect(this.gain);
    this.gain.connect(audioContext.destination);

    this.progress = $('#circleProgress').circleProgress({
      startAngle: -Math.PI / 2,
      size: 278,
      thickness: 6,
      animation: {
          duration: 0,
          easing: 'circleProgressEasing'
      },
      value: 0,
      fill: { color: '#555555' }
    });

    this.bindEvents();
  }

  Player.prototype.play = function() {
    if(this.isPlaying) {
      return;
    }
    if(this.source) {
      this.source.disconnect(this.analyser);
    }
    this.source = audioContext.createBufferSource();
    this.source.connect(this.analyser);

    var current = this.playlist.getCurrent();
    if(current) {
      this.setTags(current);

      current.getAudioBuffer().then(function (audioBuffer){
        this.source.buffer = audioBuffer;

        this.position = this.position || 0;
        this.startTime = audioContext.currentTime - this.position;
        this.source.start(0, this.position);

        this.isPlaying = true;
        this.$node.trigger('play', true);

        requestAnimationFrame(this.timeUpdate.bind(this));
      }.bind(this));
    }
  };

  Player.prototype.setTags = function(audioFile) {
    if(audioFile instanceof AudioFile) {
      audioFile.getTags().then(function (tags){
        $('#playerCover').css('background-image', 'url(src)'.replace('src', tags.coverSrc));
      });
    }
  };

  Player.prototype.timeUpdate = function() {
    if(this.isPlaying) {
      this.position = audioContext.currentTime - this.startTime;

      if (this.position >= this.source.buffer.duration) {
        this.position = this.buffer.duration;
        this.pause();
      }

      var progress = this.position / this.source.buffer.duration;
      this.progress.circleProgress({ value: progress });

      this.analyser.getByteFrequencyData(this.freqs);

      var ctx = this.frequencyCanvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.clearRect(0, 0, this.frequencyCanvas.width, this.frequencyCanvas.height);

      for (var i = 0, j = 0; i < this.analyser.frequencyBinCount; i++) {
        if(i % 2 != 0){
          continue;
        }
        var value = this.freqs[i];
        var percent = value / 256;
        var height = 160 * Math.pow(percent, 3);
        var offset = (268/2 - height) / 2 + 8;
        var barWidth = 268 / this.analyser.frequencyBinCount * 4 / 2;
        ctx.fillRect(268/2 + 12.2 + j * barWidth, offset, barWidth, height);
        ctx.fillRect(268/2 + 11.8 - j * barWidth, offset, barWidth, height);

        j++;
      }

      requestAnimationFrame(this.timeUpdate.bind(this));
    }
  }

  Player.prototype.pause = function() {
    if(!this.isPlaying) {
      return;
    }
    this.source.stop(0);

    this.position = audioContext.currentTime - this.startTime;

    this.isPlaying = false;
    this.$node.trigger('play', false);
  }

  Player.prototype.prev = function() {
    this.pause();
    this.playlist.prev();
    this.position = 0;
    this.play();
  }

  Player.prototype.next = function() {
    this.pause();
    this.playlist.next();
    this.position = 0;
    this.play();
  }

  Player.prototype.bindEvents = function() {
    $('#fileChooser').on('change', function (event){
      this.playlist.addFileList(event.target.files);
      if(!this.isPlaying) {
        this.play();
      }
    }.bind(this));
    $('#playerPlayPause').on('click', function(e) {
      if(this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }.bind(this));
    this.$node.on('play', function(e, isPlaying) {
      if(isPlaying) {
        $('#playerPlayPause').addClass('pause');
      } else {
        $('#playerPlayPause').removeClass('pause');
      }
    }.bind(this));
    $('#playerPrev').on('click', this.prev.bind(this));
    $('#playerNext').on('click', this.next.bind(this));
  };

  return Player;
});
