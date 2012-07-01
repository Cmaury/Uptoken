var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;


//TokensDB
TokensDB = function(host, port) {
  this.db= new Db('uptoken', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

TokensDB.prototype.getCollection= function(callback) {
  this.db.collection('token', function(error, token_collection) {
    if( error ) callback(error);
    else callback(null, token_collection);
  });
};

TokensDB.prototype.isValid = function(user_id, token, callback) {
    this.getCollection(function(error, token_collection) {
      if( error ) callback(error)
      else {
        token_collection.findOne({'token': token}, function(error, token_data) {
          if( token_data == null ) callback('Invalid Token')
          else TokensDB.prototype.lastUser(token_collection, user_id, token_data, callback)
        });
      }
    });
};

TokensDB.prototype.lastUser = function(token_collection, user_id, token_data, callback) {
        token_collection.findOne({'token':token}, function(error, token) {
          //console.log("1 " + user_id)
          if( user_id == token_data.users[token_data.users.length -1] ) callback('Bad Karma. You can\'t upvote yourself!')
          else TokensDB.prototype.upVote(token_collection, user_id, token_data, callback)
        });
      };

TokensDB.prototype.upVote = function(token_collection, user_id, token_data, callback) {
  token_collection.update({ "token": token_data.token}, {$push: {"users": user_id, "timestamp":new Date()}}, function(error, token) {
          //console.log("2 " + user_id)
          callback(null);
        });
      };


//User Score
UserScore = function(host, port) {
  this.db= new Db('uptoken', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

UserScore.prototype.getCollection= function(callback) {
  this.db.collection('userScore', function(error, userScore_collection) {
    if( error ) callback(error);
    else callback(null, userScore_collection);
  });
};

UserScore.prototype.findOne = function(user_id, callback) {
    this.getCollection(function(error, userScore_collection) {
      if( error ) callback(error)
      else {
        //console.log("user "+ user_id);
        userScore_collection.findOne({"user_id": user_id}, function(error, results) {
        if(!results) {
          //console.log("no user found")
          userScore_collection.save({"user_id": user_id},  function(error, results) {
          if( error) callback(error);
          else {
            var results = {"score": 0}
            callback(null, results);
           } 
          });
         }
        if( error ) callback(error);
        else callback(null, results);
        });
      }
    });
};

UserScore.prototype.increment = function(user_id, callback) {
    this.getCollection(function(error, userScore_collection) {
      if( error ) callback(error)
      else {
        //console.log("3 " + user_id)
        userScore_collection.findOne({"user_id": user_id},  function(error, results) {
        if( error ) callback(error)
        //console.log(results)  
        if(!results) {
          //console.log("no user found")
          entry =  {"user_id": user_id, "score": 1}
          userScore_collection.save(entry,  function(error, results) {
          if( error) callback(error);
          else {
           var results = {"score": 0} 
           callback(null, results); 
          }
          });
         }
        else  userScore_collection.update({"user_id": user_id}, {$inc: {"score": 1}}, true, function(error, result) {
          if( error ) callback(error);
          else {
            callback(null, results);
          }
         }); 
        });
      }
    });
};

//Users
UsersDb = function(host, port) {
  this.db= new Db('uptoken', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

UsersDb.prototype.getCollection= function(callback) {
  this.db.collection('users', function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
};

UsersDb.prototype.findAll = function(callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.find().toArray(function(error, results) {
          //console.log(results);
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

UsersDb.prototype.collect = function(userId, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user_collection.update({"_id": user_collection.db.bson_serializer.ObjectID.createFromHexString(userId)}, "$score", upsert)
      //console.log(user_collection.findOne({"_id": user_collection.db.bson_serializer.ObjectID.createFromHexString(userId)}))
      if( error ) callback(error)
      else callback(null, results)
    }  
  });
};


UsersDb.prototype.findUser = function(userId, callback) {
    this.getCollection(function(error, user_collection) {
      //console.log(userId)
      if( error ) callback(error)
      else {
        user_collection.findOne({"_id": user_collection.db.bson_serializer.ObjectID.createFromHexString(userId)}, function(error, results) {
          //console.log("Hello" + results);
          if( error ) callback(error)
          else callback(null, results, ideas)
        });
      }
    });
};

exports.UsersDb = UsersDb;
exports.UserScore = UserScore;
exports.TokensDB = TokensDB;