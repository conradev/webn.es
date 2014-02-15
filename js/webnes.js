var WebNES = function(nes) {
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

  // Unlock audio
  var self = this;
  window.addEventListener('touchstart', function() {
    var source = self.audio.createBufferSource();
    source.buffer = self.audio.createBuffer(1, 1, 22050);
    source.connect(self.audio.destination);
    source.start(0);    
  });
};

WebNES.prototype = {
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

$(function() {
  var db = openDatabase('webnes', '1.0', 'Downloaded NES ROMs', 2 * 1024 * 1024);
  var nes = new JSNES({ 'ui': WebNES, fpsInterval: 2000, emulateSound: true });

  function renderItem(record) {
    var item = $('<li/>').text(record.name).attr('id', record.id);
    item.click(function(){
      $('#home').hide();
      $('#play').show();
      var rom = localStorage.getItem(record.storage);
      nes.loadRom(rom);
      nes.start();
    });
    return item;
  };

  function addRom(name, url) {
    $.ajax({
      type: 'GET',
      url: url,
      timeout: 3000,
      mimeType: 'text/plain; charset=x-user-defined',
      success: function(data) {
        var key = Math.random().toString(36).slice(2);
        localStorage.setItem(key, data);
        db.transaction(function(tx){
          tx.executeSql('INSERT INTO roms (id, name, storage) VALUES (?, ?, ?)', [null, name, key]);
          tx.executeSql('SELECT * FROM roms WHERE storage = ?', [key], function(tx, result) {
            $('#scroll ul').append(renderItem(result.rows.item(0)));
          });
        });
      }
    });
  }

  db.transaction(function(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS roms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, storage TEXT)');
    tx.executeSql('SELECT * FROM roms', [], function(tx, result) {
      for (var i = 0; i < result.rows.length; i++) {
        $('#scroll ul').append(renderItem(result.rows.item(i)));
      }
      if (result.rows.length == 0) {
        addRom('Croom', 'roms/croom.nes');
        addRom('Tetramino', 'roms/lj65.nes');
      }
    });
  });

  $('#addROM').click(function() {
    Dropbox.choose({
      success: function(files) {
        files.forEach(function(file) {
          addRom(file.name.replace('.nes', ''), file.link);
        });
      },
      linkType: "direct",
      multiselect: true,
      extensions: ['.nes']
    });
  });
});