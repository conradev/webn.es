$("#playButton").click(function(){
    console.log("show");
    //Hide home and display play screen
    $("#home").hide();
    $("#play").show("show");
    
    //Start NES
    var nes = new JSNES({ 'ui': Webnes, fpsInterval: 2000, emulateSound: true });
    console.log("webnes initialized");
})