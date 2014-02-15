var fs = require('fs');
var path = require('path');

var items = [ 'index.html', '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', 'https://www.dropbox.com/static/api/1/dropins.js' ]
var js = fs.readdirSync('js').map(function(filename) { return path.join('js', filename); });
var css = fs.readdirSync('css').map(function(filename) { return path.join('css', filename); });
var images = fs.readdirSync('images').map(function(filename) { return path.join('images', filename); });
items = items.concat(js).concat(css).concat(images);

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

contents = 'CACHE MANIFEST\nCACHE:\n' + filtered.join('\n') + '\nNETWORK:\n*\nhttp://*\nhttps://*\n';
fs.writeFileSync('webnes.appcache', contents, encoding='utf8');

var exec = require('child_process').exec;
exec('s3cmd sync --exclude ".git/*" --exclude ".gitignore" --exclude "tools/*" --exclude-from ".gitignore" --include "webnes.appcache" --delete-removed . s3://webn.es/', function (error, stdout, stderr) {
	console.log(stdout);
});
