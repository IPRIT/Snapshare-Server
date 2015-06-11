var mongoose    = require('mongoose');
var config      = require('../config/config').config;

mongoose.connect(config.mongoose.uri);

var db = mongoose.connection;

db.on('error', function (err) {
    console.log('connection error:', err.message);
});

db.once('open', function callback () {
    console.log("Connected to MongoDB!");
});

var Schema = mongoose.Schema;

// Schemas
var User = new Schema({
    info: {
        social_id: {
            type: String,
            index: true
        },
        first_name: String,
        last_name: String,
        photo: String
    },
    social_type: {
        type: String,
        enum: [
            'vk',
            'fb',
            'google'
        ],
        required: true
    },
    social_access_token: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    },
    friends: {
        type: [String],
        index: true
    }
});

User.virtual('info.fullname').get(function () {
    return this.info.first_name + ' ' + this.info.last_name;
});

User.methods.areFriends = function(anotherSocialId, callback) {
    return this.model('UserModel').count({
        _id: this._id,
        friends: anotherSocialId
    }, callback);
};

var AccessToken = new Schema({
    user_id: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

AccessToken.path('token').validate(function (value) {
    return value.length >= 32 && value.length <= 128;
});

var UserModel = mongoose.model('User', User);
var AccessTokenModel = mongoose.model('AccessToken', AccessToken);

module.exports = {
    UserModel: UserModel,
    AccessTokenModel: AccessTokenModel
};