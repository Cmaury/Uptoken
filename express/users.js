UsersDb = function(host, port) {
  this.db= new Db('users', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

exports.UsersDb = UsersDb;