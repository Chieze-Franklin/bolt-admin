var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var fs = require('fs');

var controller = require('./controllers/controller');
var router = require('./routers/router');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
/*app.use(function (request, response, next) {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  next();
});*/

app.use('/', express.static(__dirname));
app.use('**/assets', express.static(__dirname + '/assets'));

app.set('views', __dirname + '/views');
app.engine('html', exphbs.create({
  defaultLayout: 'main.html',
  layoutsDir: app.get('views') + '/layouts',
  partialsDir: [app.get('views') + '/partials'],
  helpers: {
    json: function(obj) {
      return JSON.stringify(obj);
    }
  }
}).engine);
app.set('view engine', 'html');

app.use(function(req, res, next){
  if (process.env.BOLT_CHILD_PROC) { //check to be sure it is running as a system app
    res.send("This app has to run as a system app.");
  }
  else { //check for logged-in user
    req.app_root = process.env.BOLT_ADDRESS + "/x/" + controller.getAppName();
    if (req.user) {
      if (!req.user.displayPic) req.user.displayPic = process.env.BOLT_ADDRESS + 'public/bolt/uploads/user.png';
      next();
    }
    else { //there is no logged-in user
      if (req.originalUrl.indexOf('/hook/') > 0 || req.originalUrl.indexOf('/action/') > 0) {
        next();
      }
      else {
        var success = encodeURIComponent(req.protocol + '://' + req.get('host') + req.originalUrl);
        res.redirect(process.env.BOLT_ADDRESS + '/login?success=' + success + '&no_query=true'); //we don't want it to add any query string
      }
    }
  }
});

app.use(router);

module.exports = app;