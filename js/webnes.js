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
  $(document).one('touchstart', function() {
    var source = self.audio.createBufferSource();
    source.buffer = self.audio.createBuffer(1, 1, 22050);
    source.connect(self.audio.destination);
    source.start(0);
  });

  var intervalId = 0;
  var startEvent = 'touchstart';
  var stopEvent = 'touchend';
  this.screen.addEventListener(startEvent, function() {
    intervalId = setInterval(function() {
      $('#home').slideDown(250);
      $('#portrait_controls').fadeOut(250);
      $('#play').slideUp(250);
      $(document).unbind('touchmove');
      nes.stop();
      clearInterval(intervalId);
    }, 1000); }, false);
  this.screen.addEventListener(stopEvent, function() {
    clearInterval(intervalId);
  }, false);
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
  h = window.screen.availHeight
  w = window.screen.availWidth

  if (h >= 640) {
    $("#portrait_up").css("top", "61%")
    $("#portrait_right").css("top", "70%")
    $("#portrait_down").css("top", "75%")
    $("#portrait_left").css("top", "70%")
    $("#portrait_select").css("top", "84%")
    $("#portrait_start").css("top", "84%")
    $("#portrait_B").css("top", "66%")
    $("#portrait_A").css("top", "60%")
  }

  if(!jQuery.browser.mobile){
    $('#home').hide();
    $('#play').hide();
    $('#desktopLanding').fadeIn(500);
  }
  
  var db = openDatabase('webnes', '1.0', 'Downloaded NES ROMs', 2 * 1024 * 1024);
  var nes = new JSNES({ 'ui': WebNES, fpsInterval: 2000, emulateSound: true });

  function renderItem(record) {
    var item = $('<li/>').text(record.name).attr('id', record.id);
    var alerted = false;
    var timeoutId = 0;
    var startEvent = 'touchstart';
    var stopEvent = 'touchend';
    item.bind(startEvent, function() {
      alerted = false;
      timeoutId = window.setTimeout(function() {
        alerted = true;
        if (!confirm("Delete this ROM?")) return;
        db.transaction(function(tx){
          tx.executeSql('DELETE FROM roms WHERE id = ?', [record.id], function() {
            localStorage.removeItem(record.storage);
            item.remove();
          });
        });
      }, 1000);
    }).bind(stopEvent, function() {
      clearTimeout(timeoutId);
      if (alerted) return;
      $('#home').slideUp(250);
      $('#play').slideDown(250);
      $('#portrait_controls').slideDown(250);
    
      if (nes.loadedId !== record.id) {
        var rom = localStorage.getItem(record.storage);
        nes.loadRom(rom);
        nes.loadedId = record.id;
      }
      $(document).bind('touchmove', function(e) {
        e.preventDefault();
      });
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
        addRom('Galaxy Patrol', 'roms/galaxy.nes');
        addRom('Fighter F-8000', 'roms/fighter_f8000.nes');
        addRom('BoxBoy', 'roms/BOXBOY.nes');
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

  var input = nes.input;
  var buttons = [ '#portrait_A', '#portrait_B', '#portrait_select','#portrait_start', '#portrait_up', '#portrait_down', '#portrait_left', '#portrait_right' ];
  var startEvent = 'touchstart';
  var stopEvent = 'touchend';
  buttons.forEach(function(selector) {
    $(selector).bind(startEvent, function() {
      input.setButton(buttons.indexOf(selector), true);
    }).bind(stopEvent, function() {
      input.setButton(buttons.indexOf(selector), false);
    });
  });
});