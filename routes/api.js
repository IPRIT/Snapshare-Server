var express = require('express');
var auth = require('../auth/auth');
var DbModels = require('../db/db');
var vk = require('vk-sdk');
var debug = require('../utils/utils');

var router = express.Router();

router.get('/:api_method', function(req, res, next) {
    var apiMethod = req.params.api_method;
    switch (apiMethod) {
        case 'friends.get':
            return getApiUser({
                access_token: req.query.access_token
            }, function(err, user) {
                if (err) {
                    return writeError(400, 'An error occurred', res);
                }
                if (!user.social_access_token) {
                    return writeError(400, 'Access token doesn\'t exists', res);
                }
                vk.setToken(user.social_access_token);
                vk.callMethod('friends.get', {
                    order: 'name',
                    fields: 'photo_max,first_name,last_name,id',
                    v: '5.34'
                }).then(function(response) {
                    var friends = response.items;
                    friends.sort(function(a, b) {
                        if (a.online > b.online) {
                            return -1;
                        }
                        if (a.online < b.online) {
                            return 1;
                        }
                        return 0;
                    });

                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify({
                        response: {
                            friends: friends
                        }
                    }));
                }).catch(function(err) {
                    debug.log(err);
                    return writeError(400, 'Some problems with vk api', res);
                });
            });
            break;
        default:
            return writeError(400, 'An error occurred', res);
            break;
    }
});

function getApiUser(params, callback) {
    var access_token = params.access_token;
    var AccessTokenModel = DbModels.AccessTokenModel;
    var UserModel = DbModels.UserModel;
    AccessTokenModel.findOne({ token: access_token }, function(err, documentAccessToken) {
        if (err) {
            return callback(true);
        }
        var user_id = documentAccessToken.user_id;
        UserModel.findById(user_id, function(err, user) {
            if (err) {
                return callback(true);
            }
            return callback(false, user);
        });
    });
}

function writeError(status_code, text, res) {
    res.writeHead(status_code, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
        error: text
    }));
}

module.exports = router;