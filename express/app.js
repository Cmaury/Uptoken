
/**
 * Module dependencies.
 */

var express = require('express');
//var IdeaProvider = require('./ideaprovider-mongodb').IdeaProvider;
var UsersDb = require ('./users').UsersDb;

var conf = require('./conf');

var everyauth = require('./node_modules/everyauth')
  , Promise = everyauth.Promise;

everyauth.debug = true;

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId;

var UserSchema = new Schema({})
  , User;

var mongooseAuth = require('./mongoose_auth_index');

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
        , redirectPath: '/'

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
          , registerSuccessRedirect: '/'
        }
    }
});
// Adds login: String

mongoose.model('User', UserSchema);

mongoose.connect('mongodb://localhost/user');

User = mongoose.model('User');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
//  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
//next
  app.use(express.cookieParser());
  app.use(express.session({ secret: conf.mongoose.secret}));
  app.use(mongooseAuth.middleware());
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
