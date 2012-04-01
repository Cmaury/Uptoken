
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "jalad tanagra" }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
		res.render('index', {
			title: 'UpToken.org: Real World, Real Karma',
			error: null
		});
});

app.get('/about', function(req, res) {
		res.render('about', {
			title: 'About UpToken.org'
		});
});

app.get('/collect/', function(req, res) {
	res.render('collect', {
		title: 'Collect your UpToken'
	});
});

pp.get('/user/', function(req, res) {
	res.render('user', {
		title: 'UpToken.org'
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
