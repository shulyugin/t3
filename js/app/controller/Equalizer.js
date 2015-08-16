define(['utility/inheritance', 'controller/Abstract', 'model/AudioContext'
], function (inheritance, AbstractController, audioContext){

  function Equalizer (){
    inheritance.getSuperPrototype(Equalizer).constructor.call(this);

    this.$node = $('#equalizer');
    this.$presets = $('#equalizer-presets');

    this.filters = [];
    this.output;

    this.bindEvents();
  }
	inheritance.inherits(Equalizer, AbstractController);

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

    this.getTemplate('js/app/view/equalizer.item.mustache').then(function(tpl) {
      var params = {
        id: 'eq' + this.filters.indexOf(filter),
        name: frequency / 1000 >= 1 ? parseInt(frequency / 1000, 10) + 'K' : frequency,
        max: '+10',
        min: '-10',
        freq: frequency
      };
      var rendered = Mustache.render(tpl, params);
      this.$node.append(rendered);

      $('#' + params.id).find('[data-slider]').slider({
        orientation: 'vertical',
        range: 'min',
        min: 0,
        max: 100,
        value: 50
      }).on('change', function(event, ui) {
        this.gain.value = (ui.value - 50) / 5; // centered
        console.log(this.gain.value);
      }.bind(filter))
    }.bind(this));
  };

  Equalizer.prototype.appendPreset = function(name, values) {
    this.getTemplate('js/app/view/equalizer.preset.mustache').then(function(tpl) {
      var params = {
        name: name,
        json: JSON.stringify(values)
      };
      var rendered = Mustache.render(tpl, params);
      this.$presets.append(rendered);
    }.bind(this));
  };

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
  };

  Equalizer.prototype.getConnection = function() {
    return this.filters[0];
  };

  Equalizer.prototype.bindEvents = function() {
    this.$presets.on('change', function(e) {
      var values = JSON.parse(e.target.value);
      Object.keys(values).forEach(function(key) {
        var slider = $('[data-freq="{0}"]'.replace('{0}', key));
        var value = values[key] * 5 + 50;
        slider.slider('value', values[key] * 5 + 50).trigger('change', {value: value});
      }.bind(this));
    });
  };

  return Equalizer;
});
