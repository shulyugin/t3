define(['model/AudioContext'], function (audioContext){

  function Equalizer (){
    this.$node = $('#equalizer');

    this.filters = [];
    this.output;
  }

  Equalizer.prototype.appendFilter = function(frequency) {
    var filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = 0.75; // wider bandwidth has for a lower resonance
    filter.gain.value = 0;

    this.filters.push(filter);
    if(this.filters.length > 1) {
      this.filters[this.filters.length - 2].connect(
        this.filters[this.filters.length - 1]
      );
      if(this.output) {
        this.filters[this.filters.length - 2].disconnect(this.output);
        this.filters[this.filters.length - 1].connect(this.output);
      }
    }

    this.getControlTemplate().then(function(tpl) {
      var params = {
        id: 'eq' + this.filters.indexOf(filter),
        max: '+10',
        min: '-10'
      };
      var rendered = Mustache.render(tpl, params);
      this.$node.append(rendered);

      $('#' + params.id).find('[data-slider]').slider({
        orientation: 'vertical',
        range: 'min',
        min: 0,
        max: 100,
        value: 50,
        slide: function(event, ui) {
          this.gain.value = (ui.value - 50) / 5; // centered
          console.log(this.gain.value);
        }.bind(filter)
      });
    }.bind(this));
  };

  Equalizer.prototype.getControlTemplate = (function() {
    var templateLoadPromise = $.Deferred();
    return function() {
      if(templateLoadPromise.state() === 'pending'){
        $.get('js/app/view/equalizer.item.mustache').then(function(tpl) {
          templateLoadPromise.resolve(tpl);
        });
      }
      return templateLoadPromise.promise();
    };
  })();

  Equalizer.prototype.removeFilter = function(frequency) {
    var filtersMatched = this.filters.filter(function(f) {
      return f.frequency.value == frequency;
    });
    if(filtersMatched.length == 1) {
      var idx = this.filters.indexOf(filtersMatched[0]);
      if(idx != -1) {
        $('#eq' + idx).remove();
        this.filters.splice(idx, 1);
        return true;
      }
      return false;
    }
    return false;
  };

  Equalizer.prototype.connect = function(output) {
    if(this.filters.length) {
      if(this.output) {
        this.filters[this.filters.length - 1].disconnect(this.output);
      }
      this.output = output;
      this.filters[this.filters.length - 1].connect(this.output);
    }
  }

  Equalizer.prototype.getConnection = function() {
    return this.filters[0];
  }

  return Equalizer;
});
