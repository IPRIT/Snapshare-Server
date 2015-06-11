var Config = {
    protocol: 'http',
    host: 'localhost:3000'
};
Config.redirect_uri = Config.protocol + '://' + Config.host + '/oauth/vk';

function loginWithVk() {
    var params = {
        redirect_uri: Config.redirect_uri,
        client_id: 4952927,
        scope: 'friends,offline',
        response_type: 'code',
        revoke: true
    };
    var pairParts = [];
    for (var el in params) {
        if (!params.hasOwnProperty(el)) continue;
        pairParts.push(el + '=' + params[el]);
    }
    var codeUrl = 'https://oauth.vk.com/authorize?' + pairParts.join('&');
    window.open(codeUrl, 'Auth with VK',
        "width=700,height=430,resizable=yes,scrollbars=yes,status=yes");
}