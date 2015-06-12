var DbModels = require('../db/db');
var vk = require('vk-sdk');
var config = require('../config/config').config;
var crypto = require('crypto');
var debug = require('../utils/utils');

module.exports = {
    auth: auth
};

function auth(params, callback, onError) {
    var sType = params.social_type,
        code = params.social_code;
    switch (sType) {
        case 'vk':
            vk.siteAuth({
                client_id: config.vk.client_id,
                client_secret: config.vk.client_secret,
                code: code,
                redirect_uri: config.oauth.redirect_uri
            }).then(function(data) {
                if (!data.access_token) {
                    callback(true);
                }
                var access_token = data.access_token,
                    user_id = data.user_id;
                vk.setToken(access_token);
                vk.callMethod('users.get', {
                    fields: 'photo_max'
                }).then(function(usersArray) {
                    var userInfo = usersArray[0];
                    if (!userInfo) {
                        callback(true);
                    }
                    userInfo.id = user_id;
                    insertOnDuplicateUpdateUser(userInfo, { access_token: access_token }, function(err, user) {
                        if (err) {
                            callback(true);
                        }
                        getAndSaveFriends(user, function(err, user) {
                            if (err) {
                                callback(true);
                            }
                            debug.log('[Friends saved]', user);
                            generateAndSaveInternalToken(user, function(err, newToken) {
                                if (err) {
                                    callback(true);
                                }
                                callback(false, newToken);
                            });
                        });
                    });
                }).catch(onError);
            }).catch(onError);

            break;
    }
}

function insertOnDuplicateUpdateUser(userInfo, otherParams, callback) {
    var UserModel = DbModels.UserModel;
    UserModel.findOne({ 'info.social_id': 'vk_' + userInfo.id }, function(err, user) {
        if (err) {
            callback(true);
        }

        if (user) {
            user.social_access_token = otherParams.access_token;
            user.info.photo = userInfo.photo_max;
            user.info.first_name = userInfo.first_name;
            user.info.last_name = userInfo.last_name;
        } else {
            debug.log('New user');
            user = new UserModel({
                info: {
                    social_id: 'vk_' + userInfo.id,
                    first_name: userInfo.first_name,
                    last_name: userInfo.last_name,
                    photo: userInfo.photo_max
                },
                social_type: 'vk',
                social_access_token: otherParams.access_token,
                friends: []
            });
        }
        user.save(function (err) {
            if (!err) {
                debug.log('User saved!', user);
                callback(false, user);
            } else {
                debug.log('An error occurred in save new user', err);
            }
        });
    });
}

function getAndSaveFriends(user, callback) {
    vk.callMethod('friends.get', {
        order: 'hints',
        v: '5.34'
    }).then(function(res) {
        var friends = res.items;
        for (var el in friends) {
            friends[el] = 'vk_' + friends[el];
        }
        user.friends = friends;
        user.save(function(err) {
            if (!err) {
                debug.log('Friends has been received!');
                callback(false, user);
            } else {
                debug.log('An error occurred in save user friends', err);
            }
        });
    }).catch(function(err) {
        callback(true);
    });
}

function generateAndSaveInternalToken(user, callback) {
    var token = crypto.randomBytes(32).toString('hex');
    var user_internal_id = user._id;
    var access_token = new DbModels.AccessTokenModel({
        user_id: user_internal_id,
        token: token
    });
    access_token.save(function(err) {
        if (err) {
            return callback(true);
        }
        callback(false, access_token);
    });
}