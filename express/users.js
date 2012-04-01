var mongoose = require('mongoose').Mongoose;

mongoose.model('User', {
  properties: ['id', 'name', 'karma', 'date_created', 'token_hash'],

  indexes: [
    'id'
  ]
});

exports.User = function(db) {
  return db.model('User');
};
