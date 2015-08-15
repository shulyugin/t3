define(['model/AudioContext'], function (audioContext){

  function Equalizer (){
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

    // todo: optimize
    var eqSlider = document.createElement('div');
    eqSlider.id = 'eqSlider' + this.filters.indexOf(filter);
    $('#equalizer').append(eqSlider);
    $('#' + 'eqSlider' + this.filters.indexOf(filter)).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      value: 50,
      slide: function(event, ui) {
        this.gain.value = (ui.value - 50) / 5; // centered
        console.log(this.gain.value);
      }.bind(filter)
    }).css({
      float: 'left',
      marginRight: 14
    });
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
