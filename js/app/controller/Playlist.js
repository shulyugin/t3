define(['utility/inheritance', 'controller/Abstract', 'model/AudioFileList'
], function (inheritance, AbstractController, AudioFileList){

  function Playlist (){
    inheritance.getSuperPrototype(Playlist).constructor.call(this);

    this.$node = $('#playlist');
    this.tracks = new AudioFileList();

    this.bindEvents();
  }
  inheritance.inherits(Playlist, AbstractController);

  Playlist.prototype.addFileList = function(files) {
    if(files instanceof FileList) {
      files = Array.prototype.slice.apply(files);
    } else if(!(files instanceof Array)) {
      return;
    }
    files = files.filter(function(file) {
      return file.type.indexOf('audio') != -1;
    });
    files.forEach(function (file){
      if(this.tracks.addFile(file)) {
        var audioFile = this.tracks.getLast();
        audioFile.getTags().then(function (tags){
          this.getTemplate('js/app/view/playlist.item.mustache').then(function(tpl) {
            var params = {
              id: 'track' + this.tracks.indexOf(audioFile),
              trackIdx: this.tracks.indexOf(audioFile),
              author: tags.artist ? tags.artist + ' - ' : (tags.album ? tags.album + ' - ' : ''),
              song: tags.title,
              duration: '' // further when audio buffer retrieved
            };
            var rendered = Mustache.render(tpl, params);

            // sorting
            var presentTracks = Array.prototype.slice.apply($('[data-track-idx]'));
            if(presentTracks.length > 0) {
              var nextTrack = presentTracks.reduce(function(prev, next) {
                var pd = $(prev).data()['trackIdx'];
                var nd = $(next).data()['trackIdx'];
                if(pd < nd && params.trackIdx < pd) {
                  return prev;
                } else if(nd < pd && params.trackIdx < nd){
                  return next;
                } else {
                  return pd > nd ? prev : next;
                }
              });
              nextTrack = $(nextTrack);
              if(params.trackIdx < nextTrack.data()['trackIdx']) {
                nextTrack.before(rendered);
              } else {
                this.$node.append(rendered);
              }
            } else {
              this.$node.append(rendered);
            }

            var trackNode = $('#' + params.id);
            trackNode.on('click', function(e) {
              if(trackNode.hasClass('active')) { // seek
                var left = trackNode[0].getBoundingClientRect()['left'];
                var width = trackNode.width();
                var percent = (e.clientX - left) / width * 100;
                percent = percent < 100 ? percent : 99.5;
                window.player.seek(percent);
              } else {
                window.player.pause();
                this.tracks.set(this.tracks.get(trackNode.data()['trackIdx']));
                window.player.play(true);
              }
            }.bind(this));

          }.bind(this));
        }.bind(this));
      }
    }.bind(this));
    return files.length;
  };

  Playlist.prototype.getCurrent = function() {
    return this.tracks.getCurrent();
  };

  Playlist.prototype.getCount = function() {
    return this.tracks.getCount();
  };

  Playlist.prototype.prev = function() {
    return this.tracks.prev();
  };

  Playlist.prototype.next = function() {
    return this.tracks.next();
  };

  Playlist.prototype.bindEvents = function() {
    $('#player').on('play', function(e, isPlaying) {
      if(isPlaying) {
        var idx = this.tracks.indexOf(this.tracks.getCurrent());

        var duration = window.player.source.buffer.duration;
        var minutes = parseInt(duration / 60, 10);
        var seconds = parseInt(duration % 60, 10);
        if(seconds < 10) {
          seconds = '0' + seconds;
        }

        if(this.active && this.activeProgress) {
          this.active.removeClass('active');
          this.activeProgress.width(0);
        }
        this.active = $('#track' + idx);
        this.active.addClass('active');
        this.activeProgress = this.active.find('[data-track-progress]');
        this.activePosition = this.active.find('[data-track-position]');
        this.active.find('[data-track-duration]').html(minutes + ':' + seconds);
      }
    }.bind(this));

    $('#player').on('progress', function(e, progress) {
      this.activeProgress.width(progress * 100 + '%');

      var secondsPassed = parseInt(progress * window.player.source.buffer.duration, 10);
      var minutes = parseInt(secondsPassed / 60, 10);
      var seconds = parseInt(secondsPassed % 60, 10);
      if(seconds < 10) {
        seconds = '0' + seconds;
      }
      this.activePosition.html(minutes + ':' + seconds);
    }.bind(this));
  }

  return Playlist;
});
