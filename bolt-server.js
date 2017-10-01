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

/*
app.get('/users', function (req, res) {
  //get registered users
  superagent
    .get(process.env.BOLT_ADDRESS + '/api/users')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var users = usersResponse.body.body;

      var scope = {
        app: __app,
        app_root: req.app_root,
        bolt_root: process.env.BOLT_ADDRESS,
        section: __app.displayName + " \u21D2 Users (" + users.length + ")",
        user: req.user,
        year: __year,

        users: users
      };
      res
        .set('Content-type', 'text/html')
        .render('users.html', scope);
    });
});

app.get('/users-add', function (req, res) {////////////////////////
  var scope = {
    app: __app,
    bolt:  __bolt,
    user: __user,
    year: __year,

    section: "Add User"
  };
  res
    .set('Content-type', 'text/html')
    .render('users-add.html', scope);
});

app.get('/users/roles/:name', function (req, res) {
  superagent
    .get(process.env.BOLT_ADDRESS + '/api/users/' + req.params.name)
    .end(function(error, userResponse){
      //TODO: check error and appResponse.body.error
      var user = userResponse.body.body;

      //get user's roles
      superagent
        .get(process.env.BOLT_ADDRESS + '/api/user-roles?user=' + req.params.name)
        .end(function(error, userRolesResponse){
          //TODO: check error and userRolesResponse.body.error
          var userRoles = userRolesResponse.body.body;

          superagent
            .get(process.env.BOLT_ADDRESS + '/api/roles')
            .end(function(rolesError, rolesResponse){
              var roles = rolesResponse.body.body;
              var indicesToRem = [];
              indicesToRemove = userRoles.map(function(appRl, idx){
                for (var index = 0; index < roles.length; index++) {
                  if (appRl.role == roles[index].name) {
                    appRl.roleInfo = roles[index];
                    return index;
                  }
                }
              });
              var filteredRoles = [];
              filteredRoles = roles.filter(function(r, index){
                return indicesToRemove.indexOf(index) == -1;
              });
              
              var scope = {
                app: __app,
                app_root: req.app_root,
                bolt_root: process.env.BOLT_ADDRESS,
                section: __app.displayName + " \u21D2 Users \u21D2 " + user.displayName + " (" + user.name + ")",
                user: req.user,
                year: __year,

                current_user: user,
                roles: filteredRoles,
                rolesHasElements: (filteredRoles.length > 0),
                userRoles: userRoles
              };
              res
                .set('Content-type', 'text/html')
                .render('users-roles.html', scope);
            });
        });
    });
});

app.get('/users/:username', function (req, res) {////////////////////////
  //get user
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/users/' + req.params.username)
    .end(function(error, userResponse){
      //TODO: check error and userResponse.body.error
      var user = userResponse.body.body;
      var scope;
      if(user){
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: user.displayName,

          boltUser: user
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('user.html', scope);
    });
});*/

module.exports = app;