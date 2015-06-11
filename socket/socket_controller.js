var DbModels = require('../db/db');
var SocketUsers = require('./socket_users');

function Connect(io) {
    io.on('connection', function(socket) {
        console.log('A user connected');
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
                socket.emit('user joined');
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
                if (err) {
                    return;
                }
                var friends = user.friends;
                for (var el in friends) {
                    if (friends[el] === to_social_id) {
                        var receiver_socket_ids = SocketUsers.getUserSockets(to_social_id);
                        if (receiver_socket_ids && Array.isArray(receiver_socket_ids)) {
                            for (var i = 0; i < receiver_socket_ids.length; ++i) {
                                console.log('Link sent from', user.info.fullname, '->',
                                    to_social_id, '(Link:', data.value, ')');
                                socket.to(receiver_socket_ids[i]).emit('friend sent link', {
                                    data: data,
                                    sender: user.info,
                                    timestamp: new Date().getTime()
                                });
                            }
                        }
                        break;
                    }
                }
            });
        });

        socket.on('disconnect', function() {
            console.log('User disconnected');
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
        var user_id = documentAccessToken.user_id;
        UserModel.findById(user_id, function(err, user) {
            if (err) {
                return callback(true);
            }
            return callback(false, user);
        });
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


module.exports.connect = Connect;