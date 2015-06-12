var express = require('express');
var auth = require('../auth/auth');
var debug = require('../utils/utils');

var router = express.Router();


router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'test'
    });
});

router.get('/oauth/:service', function(req, res, next) {
    if (req.query.error) {
        res.writeHead(500, {
            'Content-Type': 'text/html'
        });
        return res.render('oauth/error', {
            error: 'An error occurred'
        });
    }

    switch (req.params.service) {
        case 'vk':
            if (req.query.code) {
                auth.auth({
                    social_type: 'vk',
                    social_code: req.query.code
                }, function(err, sAccessToken) {
                    debug.log(err, sAccessToken);
                    if (err) {
                        res.writeHead(500, {
                            'Content-Type': 'text/html'
                        });
                        return res.render('oauth/error', {
                            error: 'An error occurred'
                        });
                    }
                    return res.render('oauth/success', {
                        token: sAccessToken.token
                    });
                }, function(err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/html'
                    });
                    debug.log(err);
                    return res.render('oauth/error', {
                        error: 'An error occurred'
                    });
                });
            } else {
                res.writeHead(500, {
                    'Content-Type': 'text/html'
                });
                return res.render('oauth/error', {
                    error: 'An error occurred'
                });
            }
            break;
        default:
            return res.render('oauth/error', {
                error: 'Not found'
            });
            break;
    }
});


module.exports = router;