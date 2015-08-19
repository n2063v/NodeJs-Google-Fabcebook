/**
 * Loading all the dependencies here
 */
var express = require('express');
var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var router = express.Router();
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;


/**
 * Setting up required files here
 */
var authenticate = require('../config/authenticate.js');
var config = require('../config/config');

/**
 * Setting up the Googe's OAuth2 authentication here
 */
var oauth2Client = new OAuth2(config.google.clientID, config.google.clientSecret, config.google.callbackURL);


/**
 * GET: Error Page - Render error.ejs
 */
router.get('/error', function (req, res) {
    res.render('error.ejs');
});


/**
 * GET: Home Page's Route - render the index.js
 */
router.get('/', function (req, res) {
    res.render('index.ejs');
});


// *****************************************************************
// Function : Render && Process Local Sign Up
// Status : DONE
// *****************************************************************
// Render
router.get('/register', function (req, res) {
    res.render('register.ejs', {
        message: req.flash('error')
    });
});


// Process
router.post('/register', passport.authenticate('signup', {
    successRedirect : '/profile',
    failureRedirect : '/register',
    failureFlash : true
}));


// *****************************************************************
// Function : Process LogIn && SignUp with Facebook
// Status : DONE
// *****************************************************************
// Render to call
router.get('/auth/facebook',
    passport.authenticate('facebook', { scope: 'email' }
));

// Process
router.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
    successRedirect : '/profile',
    failureRedirect: '/',
    failureFlash : true
}));


// *****************************************************************
// Function : Process LogIn && SignUp with Google
// Status : DONE
// *****************************************************************
router.get('/google', function (req, res) {

    // generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [config.google.scope_1, config.google.scope_2, config.google.scope_3];
    // generate the url
    var url = oauth2Client.generateAuthUrl({
        access_type: 'online', // 'online' (default) or 'offline' (gets refresh_token)
        scope: scopes // If you only need one scope you can pass it as string
    });
    // Check the url
    if (url) {
        request.post(url, function (err, httpResponse, body) {
            // Redirect to the google login for permission to our app
            if (httpResponse.headers.location) {
                res.redirect(httpResponse.headers.location);
            }
        });
    }
});


// the callback after google has authenticated the user
router.get('/auth/google/callback', function (req, res) {
    // Setting up the code to exchange the authorization code
    var plus = google.plus('v1');
    var route = req.query.code;
    if (route) {
        oauth2Client.getToken(route, function (err, tokens) {
            // Now tokens contains an access_token and an optional refresh_token. Save them.
            if (!err) {
                if (tokens) {
                    oauth2Client.setCredentials(tokens);
                    plus.people.get({ userId: 'me', auth: oauth2Client }, function (err, response) {
                        // Get the information
                        var email = response.emails[0].value;
                        var firstName = response.name.givenName;
                        var lastName = response.name.familyName;
                        // Redirect to our page
                        if (email && firstName && lastName) {
                            res.redirect('/google/done/' + email + '/' + firstName + '/' + lastName);
                        }
                    });
                }
            }
        });
    }
});

// Process to login and sign up new account
router.get('/google/done/:email/:firstName/:lastName', passport.authenticate('custom', {
    successRedirect : '/profile',
    failureRedirect : '/login',
    failureFlash : true
}));

// *****************************************************************
// Function : Render && Process Local Sign In
// Status : DONE
// *****************************************************************
// Render
router.get('/login', function (req, res) {
    res.render('login.ejs', {
        message: req.flash('loginMessage')
    });
});

// Process
router.post('/login', passport.authenticate('login', {
    successRedirect : '/profile',
    failureRedirect : '/login',
    failureFlash : true
}));


// Export all the routes
module.exports = router;