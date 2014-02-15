var fs = require('fs');
var path = require('path');

var css = fs.readdirSync('css').map(function(filename) { return path.join('css', filename); });
var images = fs.readdirSync('images').map(function(filename) { return path.join('images', filename); });
var js = fs.readdirSync('js').map(function(filename) { return path.join('js', filename); });
var items = css.concat(images).concat(js);

var unwanted = fs.readFileSync('.gitignore').toString().split('\n');
var unwanted = unwanted.filter(function(item) {
	return !item.trim().match(/^#/);
});

var filtered = [];
for (i = 0; i < items.length; i++) {
	if (unwanted.indexOf(path.basename(items[i])) < 0) {
		filtered.push(items[i]);
	}
}

contents = 'CACHE MANIFEST\nCACHE:\n' + filtered.join('\n') + '\n';
fs.writeFileSync('webnes.appcache', contents, encoding='utf8');
