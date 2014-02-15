var Webnes = function(nes) {
  this.nes = nes;
  this.audio = new webkitAudioContext();

  // Initialize screen context
  this.screen = document.getElementById('screen');
  this.canvasContext = this.screen.getContext('2d');
  this.canvasContext.fillStyle = 'black';
  this.canvasContext.fillRect(0, 0, 256, 240);

  // Initialize framebuffer
  this.canvasData = this.canvasContext.getImageData(0, 0, 256, 240);
  for (var i = 3; i < this.canvasData.data.length - 3; i += 4) {
      this.canvasData.data[i] = 0xFF;
  }

  // Unlock audio and start
  var self = this;
  window.addEventListener('touchstart', function() {
    var source = self.audio.createBufferSource();
    source.buffer = self.audio.createBuffer(1, 1, 22050);
    source.connect(self.audio.destination);
    source.start(0);    
  });

  var xhr = new XMLHttpRequest();
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	xhr.open("GET", "roms/donkey.nes", true);
	xhr.onload = function (e) {
		self.nes.loadRom(xhr.responseText);
		self.nes.start();
	};
	xhr.send(null);
};

Webnes.prototype = {
  updateStatus: function(status) {
    console.log('JSNES: ' + status);
  },
  writeFrame: function(buffer, prevBuffer) {
    var data = this.canvasData.data;
    for (var i = 0; i < 256 * 240; i++) {
        var pixel = buffer[i];
        if (pixel != prevBuffer[i]) {
            var j = i * 4;
            data[j] = pixel & 0xFF;
            data[j + 1] = (pixel >> 8) & 0xFF;
            data[j + 2] = (pixel >> 16) & 0xFF;
            prevBuffer[i] = pixel;
        }
    }
    this.canvasContext.putImageData(this.canvasData, 0, 0);
  },
  writeAudio: function(leftSamples, rightSamples) {
  	var buffer = this.audio.createBuffer(2, leftSamples.length, this.nes.papu.sampleRate);
  	buffer.getChannelData(0).set(leftSamples);
    buffer.getChannelData(1).set(rightSamples);
    var source = this.audio.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audio.destination);
    source.start(0);
  }
};
