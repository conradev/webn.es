var nes = new JSNES({ 'ui': Webnes, fpsInterval: 2000, emulateSound: true });
var db = openDatabase('webnes', '1.0', 'Downloaded NES ROMs', 2 * 1024 * 1024);

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

db.transaction(function(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS roms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, storage TEXT)');
  tx.executeSql('SELECT * FROM roms', [], function(tx, result) {
    for (var i = 0; i < result.rows.length; i++) {
      $('#scroll ul').append(renderItem(result.rows.item(i))); 
    }
  });
});

$('#addROM').click(function() {
  $.ajax({
    type: 'GET',
    url: 'roms/donkey.nes',
    timeout: 3000,
    mimeType: 'text/plain; charset=x-user-defined',
    success: function(data) {
      var key = Math.random().toString(36).slice(2);
      localStorage.setItem(key, data);
      db.transaction(function(tx){
        tx.executeSql('INSERT INTO roms (id, name, storage) VALUES (?, ?, ?)', [null, 'Donkey Kong', key]);
        tx.executeSql('SELECT * FROM roms WHERE storage = ?', [key], function(tx, result) {
          $('#scroll ul').append(renderItem(result.rows.item(0))); 
        });
      });
    }
  });
});
