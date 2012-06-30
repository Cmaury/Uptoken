
/**
 * Module dependencies.
 */

var express = require('express');
var UsersDb = require ('./model').UsersDb;

var conf = require('./conf');

var everyauth = require('everyauth')
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
        , scope: 'email'
        , redirectPath: '/'

      }
    }
/*
  , password: {
        loginWith: 'login'
      , extraParams: {
          votes: Array,
      //      phone: String,
          name: {
                first: String
              , last: String
            }
        } */
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
    //}
});
// Adds login: String

mongoose.model('User', UserSchema);

mongoose.connect('mongodb://localhost/uptoken');

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


var usersDb = new UsersDb('localhost', 27017);
var userScore = new UserScore('localhost', 27017);
var tokensDB = new TokensDB('localhost', 27017);

app.get('/', function(req, res){
        res.render('index.jade', { locals: {
            title: 'UpToken.org',
            alert: null
            }
        });
});

app.post('/collect', function(req, res){
    token = req.body.collect_code;
    if (req.user== undefined) {
      res.redirect('/error/1');
    } 
    else {
      user_id = req.user._id.toString()
      console.log(token);
      tokensDB.isValid(user_id, token, function(alert) {
        console.log("redirect " + alert);
        if (alert == null) {
          userScore.increment(user_id, function(results){
              if(!results){
               console.log("no results")
                score= 0
              }
              else score = results.score;
              res.render('user.jade', {locals: {
                score: score
                alert: 'Karma-Collected'
              }});
          });
        }
        else  {
          res.redirect('/error/' + alert)
        }
      });
    };
});

app.get('/user/profile', function(req, res){
    user_id = req.user._id.toString()
    console.log("routes " + user_id);
    userScore.findOne(user_id, function(error, results) {
      if(!results){
        console.log("no results")
          score= 0
        }
        else score = results.score;
      res.render("user.jade", {locals: {  
        score: score,
        alert: ''
      }
    });
    })
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/error/1', function (req, res) {
    res.render("index.jade", {locals: {
        title: "Oops",
        alert: "Sign up to collect your upvote."
      }
    });
});

app.get('/error/:alert', function (req, res) {
    res.render("index.jade", {locals: {
        title: "Oops",
        alert: req.params.alert
      }
    });
});


mongooseAuth.helpExpress(app);

app.listen(4000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);