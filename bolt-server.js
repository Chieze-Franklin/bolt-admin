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
//-------------apps
app.get('/apps', function (req, res) {////////////////////////
  //get registered apps
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/apps')
    .end(function(error, appsResponse){
      //TODO: check error and appsResponse.body.error
      var apps = appsResponse.body.body;

      var scope = {
        app: __app,
        bolt:  __bolt,
        user: __user,
        year: __year,

        section: "Apps (" + apps.length + ")",

        apps: apps
      };
      res
        .set('Content-type', 'text/html')
        .render('apps.html', scope);
    });
});

app.get('/apps/:name', function (req, res) {////////////////////////
  //get app
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/apps/' + req.params.name)
    .end(function(error, appResponse){
      //TODO: check error and appResponse.body.error
      var app = appResponse.body.body;
      var scope;
      if(app){
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: app.displayName,

          boltApp: app
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('app.html', scope);
    });
});

app.get('/apps-add', function (req, res) {////////////////////////
  var scope = {
    app: __app,
    bolt:  __bolt,
    user: __user,
    year: __year,

    section: "Add App"
  };
  res
    .set('Content-type', 'text/html')
    .render('apps-add.html', scope);
});

app.get('/apps-sideload/:path', function (req, res) {////////////////////////
  superagent
    .post(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/apps/reg-package')
    .send({ path: req.params.path })
    .end(function(error, response){
      //TODO: check error and response.body.error
      var package = response.body.body;
      //TODO: show package.bolt.dependencies

      var scope = {};

      if(package){
        var startup = false;
        if (package.bolt.startup) startup = package.bolt.startup;
        var system = false;
        if (package.bolt.system) system = package.bolt.system;
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: "Sideload " + (package.bolt.displayName || package.name),

          path: req.params.path,
          displayName: package.bolt.displayName || package.name,
          startup: startup,
          system: system,
        };
      }

      res
        .set('Content-type', 'text/html')
        .render('apps-sideload.html', scope);
    });
});

//-------------roles
app.get('/roles', function (req, res) {////////////////////////
  //get registered roles
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/roles')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var roles = usersResponse.body.body;

      var scope = {
        app: __app,
        bolt:  __bolt,
        user: __user,
        year: __year,

        section: "Roles (" + roles.length + ")",

        roles: roles
      };
      res
        .set('Content-type', 'text/html')
        .render('roles.html', scope);
    });
});

app.get('/roles-add', function (req, res) {////////////////////////
  var scope = {
    app: __app,
    bolt:  __bolt,
    user: __user,
    year: __year,

    section: "Add Role"
  };
  res
    .set('Content-type', 'text/html')
    .render('roles-add.html', scope);
});

app.get('/roles/:name', function (req, res) {////////////////////////
  //get role
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/roles/' + req.params.name)
    .end(function(error, userResponse){
      //TODO: check error and userResponse.body.error
      var role = userResponse.body.body;
      var scope;
      if(role){
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: role.displayName,

          role: role
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('role.html', scope);
    });
});

//-----------------users

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