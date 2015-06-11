module.exports.config = {
    port : 3000,
    mongoose: {
        "uri": "mongodb://localhost/test"
    },
    oauth: {
        redirect_uri: 'http://localhost:3000/oauth/vk'
    },
    vk: {
        client_id: 4952927,
        client_secret: '5lgC8Z2oPTbBPIQjuWA5'
    }
};