
// Setting up and loading the all frameworks
var express = require('express');
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var https = require('https');
var http = require('http');
var param = require('request-param');
var flash = require('connect-flash');
var passport = require('passport');
var cookieParser = require('cookie-parser');

// Testing PORT
var port = process.env.PORT || 5858;
var app = express();
var routes = require('./routes/index.js');

// connect to our database
mongoose.connect(configDB.url);
// require the passport
require('./config/passport.js')(passport);


// Setting up the app
app.set('env', 'development');
app.set('port', port);

app.use(morgan('dev'));                                 // log every request to the console
app.use(bodyParser.json());                             // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));     // parse application/x-www-form-urlencoded
app.use(methodOverride());                              // simulate DELETE and PUT
app.set('view engine', 'ejs');                          // set up ejs for templating
app.use('/assets', express.static('assets'));
app.use('/views', express.static('views'));
app.use(cookieParser());
app.use(param());
app.use(multer());
// app.use('/assets', express.static('assets'));           // access and use files from assets


// Setting up the passport for the server + flash
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());


// Setting up the routes
app.use('/', routes);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error.ejs', {
            message: err.message,
            error: err
        });
    });
}


// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error.ejs', {
        message: err.message,
        error: {}
    });
});


http.createServer(app).listen(port, function () {
    console.log("In Development On Port : " + port);
});


module.exports = app;