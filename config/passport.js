// config/passport.js
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var CustomStrategy = require('passport-custom').Strategy;

// load up the user model
var Account = require('../models/account');
var config = require('../config/config.js');

module.exports = function (passport) {
    
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session
    
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    
    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        Account.findById(id, function (err, user) {
            done(err, user);
        });
    });
    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    
    passport.use('signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function (req, email, password, done) {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        Account.findOne({ 'email' : email }, function (err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('error', 'This email already taken!'));

            } else {
                
                // if there is no user with that email
                // create the user
                var newUser = new Account();
                // set the user's local credentials
                newUser.email = email;
                newUser.password = newUser.generateHash(password); // use the generateHash function in our user model
                newUser.Name = req.body.name;
                newUser.createdDate = Date.now();
                // save the user
                newUser.save(function (err, newUser) {
                    if (err)
                        return done(err);
                    else {
                        return done(null, newUser);
                    }
                });
            }

        });

    }));
    
    
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function (req, email, password, done) { // callback with email and password from our form
        
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        Account.findOne({ 'email' : email }, function (err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);
            
            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            
            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            
            // all is well, return successful user
            return done(null, user);
        });

    }));

    // =========================================================================
    // FACBOOK LOGIN / REGISTER ================================================
    // =========================================================================
    passport.use('facebook', new FacebookStrategy({
        clientID: config.facebook.client_id,
        clientSecret: config.facebook.client_secret,
        callbackURL: config.facebook.callback_url,
        enableProof: false,
        passReqToCallback : true,
        profileFields : ['emails', 'first_name', 'last_name']
    }, function (accessToken, refreshToken, extra, profile, done) {
        //Account.findOrCreate({ email: profile._json.email }, function (err, user) {
        //    return done(err, user);
        //});
        process.nextTick(function () {
            Account.findOne({ email: profile.emails[0].value }, function (err, user) {
                
                if (err)
                    return done(err);
                // check to see if theres already a user with that email
                if (user) {
                    return done(null, user);

                } else {
                    var fullName = "";
                    (profile.name.middleName != undefined) ? fullName = profile.name.givenName + " " + profile.name.middleName + " " + profile.name.familyName : fullName = profile.name.givenName + " " + profile.name.familyName;
                    // if there is no user with that email
                    // create the user
                    var newUser = new Account();
                    newUser.email = profile.emails[0].value;
                    newUser.Name = fullName;
                    newUser.createdDate = Date.now();
                    // save the user
                    newUser.save(function (err, newUser) {
                        if (err)
                            return done(err);
                        else {
                            return done(null, newUser);
                        }
                    });
                }
            });
        });
    }
    ));

    // =========================================================================
    // GOOGLE LOGIN / REGISTER =================================================
    // =========================================================================
    passport.use('custom', new CustomStrategy(function (info, done) {
        var arrayInfo = info.url.split("/");

        process.nextTick(function () {
            Account.findOne({ email: arrayInfo[3] }, function (err, user) {
                
                if (err)
                    return done(err);
                // check to see if theres already a user with that email
                if (user) {
                    return done(null, user);
                } else {
                    // if there is no user with that email
                    // create the user
                    var newUser = new Account();
                    newUser.email = arrayInfo[3];
                    newUser.Name = arrayInfo[4] + " " + arrayInfo[5];
                    newUser.createdDate = Date.now();
                    // save the user
                    newUser.save(function (err, newUser) {
                        if (err)
                            return done(err);
                        else {
                            return done(null, newUser);
                        }
                    });
                }
            });
        });
    }
    ));


    // =========================================================================
    // LOCAL UPDATE PASSWORD INFO  =============================================
    // =========================================================================
    passport.use('local-update', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'newPassword',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function (req, email , password, done) {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        Account.findOne({ 'email' : email }, function (err, user) {
            // if there are any errors, return the error
            if (err) {
                return done(err);
            }
            // If user exist, then update the password here
            if (user) {
                // Check if the user had the password field
                if(user.password) {
                    var newPassword = user.generateHash(password);
                    // Setting the newPassword to the oldPassword
                    user.password = newPassword;
                    // Save too the database
                    user.save(function (err) {
                        if (err)
                            return done(err);
                        return done(null, user);
                    });
                } else {
                    return done(err);
                }
            }
        });
    }));
   

}