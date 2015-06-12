var debug = require('../utils/utils');

var SocketUsers = {
    users: null,
    _init: function() {
        this.users = Object.create(null);
    },
    push: function(social_id, socket_id) {
        if (!social_id || !socket_id) {
            return;
        }
        var user_sockets = this.users[social_id];
        if (!user_sockets || !Array.isArray(user_sockets) || !user_sockets.length) {
            this.users[social_id] = [];
        }
        if (this.isExistInUserSockets(social_id, socket_id)) {
            return;
        }
        this.users[social_id].push(socket_id);
        debug.log(this.users);
    },
    isExistInUserSockets: function(social_id, socket_id) {
        if (!social_id || !socket_id) {
            return false;
        }
        var user_sockets = this.users[social_id];
        if (!user_sockets || !Array.isArray(user_sockets) || !user_sockets.length) {
            return false;
        }
        for (var el in user_sockets) {
            var s_id = user_sockets[el];
            if (s_id === socket_id) {
                return true;
            }
        }
        return false;
    },
    getUserSockets: function(social_id) {
        if (!social_id) {
            return false;
        }
        var user_sockets = this.users[social_id];
        if (!Array.isArray(user_sockets)) {
            return [];
        }
        return user_sockets;
    },
    removeUserSockets: function(social_id) {
        if (!social_id) {
            return false;
        }
        if (Array.isArray(this.users[social_id])) {
            this.users[social_id] = null;
        }
    },
    removeSocketFromUserSockets: function(social_id, socket_id) {
        if (!social_id || !socket_id) {
            return;
        }
        var user_sockets = this.users[social_id];
        if (!user_sockets || !Array.isArray(user_sockets) || !user_sockets.length) {
            return;
        }
        for (var el in user_sockets) {
            var s_id = user_sockets[el];
            if (s_id === socket_id) {
                this.users[social_id].splice(el, 1);
            }
        }
    }
};

SocketUsers._init();
module.exports = SocketUsers;