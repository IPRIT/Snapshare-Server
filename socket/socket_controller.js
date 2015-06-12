var DbModels = require('../db/db');
var SocketUsers = require('./socket_users');
var debug = require('../utils/utils');
var config = require('../config/config').config;

function Connect(io) {
    io.on('connection', function(socket) {
        debug.log('A user connected');
        socket.emit('are you connected');

        var social_id;
        socket.on('user join', function(params) {
            var access_token = params.access_token;
            getApiUser({
                access_token: access_token
            }, function(err, user) {
                if (err) {
                    return;
                }
                social_id = user.info.social_id;
                SocketUsers.push(social_id, socket.id);
                socket.emit('user joined', config.versionHash);
                var missed_messages = user.missed_messages;
                if (missed_messages.length) {
                    debug.log('Start sending missed messages', '[' + social_id + ']');
                    sendMissedMessages(missed_messages, social_id, socket, function(err, restMessages) {
                        if (err || !Array.isArray(restMessages)) {
                            return;
                        }
                        user.missed_messages = restMessages;
                        user.save(function(err) {
                            if (err) {
                                debug.log(err);
                                return;
                            }
                            debug.log('Missed messages were sent to', user.info.first_name, user.info.last_name, 'Rest: ' + restMessages.length);
                        });
                    });
                }
            });
        });

        socket.on('user sent link', function(params) {
            //взять юзера по access_token
            //проверить, является ли отправитель другом получателя
            //взять socket_ids получателя
            //отправить ссылку на полученный socket_id
            var access_token = params.access_token;
            var to_social_id = params.to;
            var data = params.data;
            getApiUser({
                access_token: access_token
            }, function(err, user) {
                if (err || !user || user.info.social_id === to_social_id) {
                    return;
                }
                var friends = user.friends;
                for (var el in friends) {
                    if (friends[el] === to_social_id) {
                        var receiver_socket_ids = SocketUsers.getUserSockets(to_social_id);
                        if (Array.isArray(receiver_socket_ids)) {
                            var shareElem = {
                                data: data,
                                from: {
                                    social_id: user.info.social_id,
                                    photo: user.info.photo,
                                    first_name: user.info.first_name,
                                    last_name: user.info.last_name
                                },
                                timestamp: new Date().getTime()
                            };
                            if (!receiver_socket_ids.length) {
                                //пользователь не в сети
                                getUserBySocialId(to_social_id, function(err, userReceiver) {
                                    if (err || !userReceiver) {
                                        return;
                                    }
                                    if (!userReceiver.missed_messages || !Array.isArray(userReceiver.missed_messages)) {
                                        userReceiver.missed_messages = [];
                                    }
                                    userReceiver.missed_messages.push(shareElem);
                                    userReceiver.save(function(err) {
                                        if (err) {
                                            debug.log(err);
                                            return;
                                        }
                                        debug.log('Share element cached:', shareElem);
                                    });
                                });
                            }
                            for (var i = 0; i < receiver_socket_ids.length; ++i) {
                                debug.log('Link sent from', user.info.fullname, '->',
                                    to_social_id, '(Link:', data.message_value, ')');
                                socket.to(receiver_socket_ids[i]).emit('friend sent link', shareElem);
                            }
                        }
                        break;
                    }
                }
            });
        });

        socket.on('disconnect', function() {
            debug.log('User disconnected');
            SocketUsers.removeSocketFromUserSockets(social_id, socket.id);
        });
    });
}

function getApiUser(params, callback) {
    var access_token = params.access_token;
    var AccessTokenModel = DbModels.AccessTokenModel;
    var UserModel = DbModels.UserModel;
    AccessTokenModel.findOne({ token: access_token }, function(err, documentAccessToken) {
        if (err) {
            return callback(true);
        }
        try {
            var user_id = documentAccessToken.user_id;
            UserModel.findById(user_id, function(err, user) {
                if (err) {
                    return callback(true);
                }
                return callback(false, user);
            });
        } catch (err) {
            return callback(true);
        }
    });
}

function getUserBySocialId(social_id, callback) {
    var UserModel = DbModels.UserModel;
    UserModel.findOne({ 'info.social_id': social_id }, function(err, user) {
        if (err) {
            return callback(true);
        }
        return callback(false, user);
    });
}

function correctAccessToken(params, callback) {
    var access_token = params.access_token;
    var AccessTokenModel = DbModels.AccessTokenModel;
    AccessTokenModel.findOne({ token: access_token }, function(err, documentAccessToken) {
        if (err || !documentAccessToken) {
            return callback(true, false);
        }
        callback(false, true);
    });
}

var defaultMissedMessagesTimeout = 10 * 1000; // 10 sec
var numOfSendMessages = 3;
function sendMissedMessages(messages, social_id, socket, callback) {
    if (!Array.isArray(messages)) {
        return callback(true);
    }
    var interval = setInterval(function() {
        debug.log('Missed interval tick', '[' + social_id + ']' + ' [Rest:' + messages.length + ']');
        var needToSend = [],
            canSend = SocketUsers.isExistInUserSockets(social_id, socket.id);
        if (canSend) {
            while (needToSend.length != numOfSendMessages && messages.length > 0) {
                needToSend.push(messages.shift());
            }
            if (!needToSend.length) {
                callback(false, []);
                clearInterval(interval);
            }
            for (var i = 0; i < needToSend.length; ++i) {
                socket.emit('friend sent link', needToSend[i]);
            }
        } else {
            callback(false, messages);
            clearInterval(interval);
        }
    }, defaultMissedMessagesTimeout);
}


module.exports.connect = Connect;