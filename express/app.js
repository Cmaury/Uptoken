
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , everyauth = require('everyauth')
  , Promise = everyauth.Promise;

var app = module.exports = express.createServer();
var conf = require('./conf');

//mongodb
var mongoose = require('mongoose')
, Schema = mongoose.Schema
, ObjectId = mongoose.SchemaTypes.ObjectId;

var UserSchema = new Schema({})
  , User;

//Auth
var mongooseAuth = require('./mongoose_auth_index');

mongoose.model('User', UserSchema);

mongoose.connect('mongodb://localhost/data/db');

User = mongoose.model('User');

UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , facebook: {
      everyauth: {
          myHostname: 'http://uptoken.org'
        , appId: conf.fb.appId
        , appSecret: conf.fb.appSecret
        , redirectPath: '/collect'

      }
    }

  , password: {
        loginWith: 'login'
      , extraParams: {
          votes: Array,
      //      phone: String,
          name: {
                first: String
              , last: String
            }
        }
      , everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'login.jade'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'register.jade'
          , loginSuccessRedirect: '/'
          , registerSuccessRedirect: '/collect'
        }
    }
});

everyauth.helpExpress(app)

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
  app.use(express.logger());
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

app.get('/user/', function(req, res) {
	res.render('user', {
		title: 'UpToken.org'
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
