define(['model/AudioContext', 'controller/Playlist', 'model/AudioFile', 'controller/Equalizer'
], function (audioContext, Playlist, AudioFile, Equalizer){

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

    // visualisation
    this.frequencyCanvas = document.getElementById('frequency');
    this.freqs = new Uint8Array(this.analyser.frequencyBinCount);

    this.volume = audioContext.createGain();
    this.volume.gain.value = 1;
    $('#volumeControl').find('[data-slider]').slider({
      orientation: 'vertical',
      range: 'min',
      min: 0,
      max: 100,
      value: 50,
      slide: function(event, ui) {
        this.volume.gain.value = ui.value / 50; // from 0 to 2 dB
        this.cachedVolume = this.volume.gain.value;
        console.log(this.volume.gain.value);
      }.bind(this)
    });

    // equalizer
    this.equalizer = new Equalizer();
    var frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
    frequencies.forEach(function (freq){
      this.equalizer.appendFilter(freq);
    }.bind(this));

    this.equalizer.connect(this.volume);
    this.volume.connect(this.analyser);
    this.analyser.connect(audioContext.destination);

    this.progress = $('#circleProgress').circleProgress({
      startAngle: -Math.PI / 2,
      size: 278,
      thickness: 6,
      animation: {
          duration: 0,
          easing: 'circleProgressEasing'
      },
      value: 0,
      fill: { color: '#555' }
    });

    this.bindEvents();
    requestAnimationFrame(this.timeUpdate.bind(this));
  }

  Player.prototype.play = function(isNewTrack) {
    if(this.isPlaying) {
      return;
    }
    if(this.pauseTimeoute) {
      clearTimeout(this.pauseTimeoute);
    }
    if(this.source) {
      this.source.disconnect(this.equalizer.getConnection());
    }
    this.source = audioContext.createBufferSource();
    this.source.connect(this.equalizer.getConnection());

    if(typeof this.cachedVolume !== 'undefined') {
      this.volume.gain.value = this.cachedVolume;
    }

    var current = this.playlist.getCurrent();
    if(current) {
      this.setTags(current);

      current.getAudioBuffer().then(function (audioBuffer){
        this.source.buffer = audioBuffer;

        this.source.onended = function (e){
          var progress = this.position / this.source.buffer.duration * 100;
          if(progress >= 99.9) {
            this.next();
          }
        }.bind(this);

        // todo: in param
        //this.source.loop = true;

        if(isNewTrack) {
          this.position = 0;
        } else {
          this.position = this.position || 0;
        }
        this.startTime = audioContext.currentTime - this.position;
        this.source.start(0, this.position);

        this.isPlaying = true;
        this.$node.trigger('play', true);
      }.bind(this));
    }
  };

  Player.prototype.setTags = function(audioFile) {
    if(audioFile instanceof AudioFile) {
      audioFile.getTags().then(function (tags){
        $('[data-song-cover]').css('background-image', 'url(src)'.replace('src', tags.coverSrc || 'i/cover.jpg'));
        $('[data-song-name]').html(tags.title);
        $('[data-song-author]').html(tags.artist || tags.album);
      });
    }
  };

  Player.prototype.timeUpdate = function() {
    if(this.isPlaying) {
      this.position = audioContext.currentTime - this.startTime;

      var progress = this.position / this.source.buffer.duration;
      this.progress.circleProgress({ value: progress });

      this.$node.trigger('progress', progress);
    }

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
      ctx.fillRect(268/2 + 16.2 + j * barWidth, offset, barWidth, height);
      ctx.fillRect(268/2 + 15.8 - j * barWidth, offset, barWidth, height);

      j++;
    }

    requestAnimationFrame(this.timeUpdate.bind(this));
  }

  Player.prototype.seek = function(percent) {
    this.pause();
    this.position = (percent / 100) * this.source.buffer.duration;
    this.play();
  };

  Player.prototype.pause = function() {
    if(!this.isPlaying) {
      return;
    }
    this.cachedVolume = this.volume.gain.value;
    this.volume.gain.value = 0;
    this.pauseTimeoute = setTimeout(function() {
      // cause a waveform to fade with animation
      requestAnimationFrame(function() {
        this.source.stop();
      }.bind(this));
    }.bind(this), 250);

    this.position = audioContext.currentTime - this.startTime;

    this.isPlaying = false;
    this.$node.trigger('play', false);
  }

  Player.prototype.prev = function() {
    this.pause();
    this.playlist.prev();
    this.position = 0;
    this.play(true);
  }

  Player.prototype.next = function() {
    this.pause();
    this.playlist.next();
    this.position = 0;
    this.play(true);
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

  // singleton
  return new Player();
});
