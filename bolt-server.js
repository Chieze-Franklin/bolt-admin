var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var express = require('express');
var fs = require('fs');
var superagent = require('superagent');
var session = require("client-sessions"/*"express-session"*/);

//---helpers
var __app = {
  displayName: "System Admin",
  name: "bolt-admin"
};
var __year = new Date().getFullYear();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (request, response, next) {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  next();
});

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
  if (process.env.BOLT_CHILD_PROC) {
    res.send("This app has to run as a system app.");
  }
  else {
    req.app_root = process.env.BOLT_ADDRESS + "/x/" +  __app.name;
    if (req.user) {
      if (!req.user.displayPic) req.user.displayPic = 'public/bolt/users/user.png';
    }
    next();
  }
});

app.post('/hooks/app-starting', function (req, res) { 
  var event = req.body;
  //__app.port = event.body.appPort,
  __app.token = event.body.appToken;
  __app.name = event.body.appName || __app.name;
  //__bolt.protocol = event.body.protocol,
  //__bolt.host = event.body.host;
  //__bolt.port = event.body.port;
  res.send();
});

app.get('/', function (req, res) {
  if (req.user) {
    var scope = {
      app: __app,
      app_root: req.app_root,
      bolt_root: process.env.BOLT_ADDRESS,
      section: __app.displayName,
      user: req.user,
      year: __year
    };
    res
      .set('Content-type', 'text/html')
      .render('index.html', scope);
  }
  else {
    var success = encodeURIComponent(process.env.BOLT_ADDRESS + '/x/' + __app.name);
    res.redirect(process.env.BOLT_ADDRESS + '/login?success=' + success);
  }
});

//-------------ac
app.get('/ac', function (req, res) {
  if (req.user) {
    //get registered apps
    superagent
      .get(process.env.BOLT_ADDRESS + '/api/apps?module=false')
      .end(function(error, appsResponse){
        //TODO: check error and appsResponse.body.error
        var apps = appsResponse.body.body;
        apps.sort(function(a, b){
          var nameA = a.displayName || a.name;
          var nameB = b.displayName || b.name;

          if (nameA > nameB) return 1;
          else if (nameA < nameB) return -1;
          else return 0;
        });

        var scope = {
          app: __app,
          app_root: req.app_root,
          bolt_root: process.env.BOLT_ADDRESS,
          section: __app.displayName + " \u21D2 Access Control",
          user: req.user,
          year: __year,

          apps: apps
        };
        res
          .set('Content-type', 'text/html')
          .render('ac.html', scope);
      });
  }
  else {
    var success = encodeURIComponent(process.env.BOLT_ADDRESS + '/x/' + __app.name + '/ac');
    res.redirect(process.env.BOLT_ADDRESS + '/login?success=' + success);
  }
});

app.get('/ac/:app', function (req, res) {
  if (req.user) {
    superagent
      .get(process.env.BOLT_ADDRESS + '/api/apps/' + req.params.app)
      .end(function(error, appResponse){
        //TODO: check error and appResponse.body.error
        var app = appResponse.body.body;

        //get app-roles
        superagent
          .get(process.env.BOLT_ADDRESS + '/api/app-roles?app=' + req.params.app)
          .end(function(error, appRolesResponse) {
            //TODO: check error and appRolesResponse.body.error
            var appRoles = appRolesResponse.body.body;

            superagent
              .get(process.env.BOLT_ADDRESS + '/api/roles')
              .end(function(rolesError, rolesResponse) {
                //TODO: check error and rolesResponse.body.error
                var roles = rolesResponse.body.body;
                var indicesToRemove = [];
                for(var a = 0; a < appRoles.length; a++) {
                  for (var b = 0; b < roles.length; b++) {
                    if (appRoles[a].role == roles[b].name) {
                      appRoles[a].roleInfo = roles[b];
                      indicesToRemove.push(b);
                      break;
                    }
                  }
                }
                var filteredRoles = [];
                for (var a = 0; a < roles.length; a++) {
                  if (indicesToRemove.indexOf(a) == -1) {
                    filteredRoles.push(roles[a]);
                  }
                }

                var scope = {
                  app: __app,
                  app_root: req.app_root,
                  bolt_root: process.env.BOLT_ADDRESS,
                  section: __app.displayName + " \u21D2 Access Control \u21D2 " + app.displayName + " (" + app.name + ")",
                  user: req.user,
                  year: __year,

                  current_app: app,
                  controlledVisibility: app.controlledVisibility,
                  roles: filteredRoles,
                  rolesHasElements: (filteredRoles.length > 0),
                  appRoles: appRoles
                };
                res
                  .set('Content-type', 'text/html')
                  .render('ac-app.html', scope);
              });
          });
      });
  }
  else {
    var success = encodeURIComponent(process.env.BOLT_ADDRESS + '/x/' + __app.name + '/ac/' + req.params.app);
    res.redirect(process.env.BOLT_ADDRESS + '/login?success=' + success);
  }
});

app.get('/ac/permissions/:app/:role', function (req, res) {
  if (req.user) {
    superagent
      .get(process.env.BOLT_ADDRESS + '/api/apps/' + req.params.app)
      .end(function(error, appResponse) {
        //TODO: check error and appResponse.body.error
        var app = appResponse.body.body;

        superagent
          .get(process.env.BOLT_ADDRESS + '/api/roles/' + req.params.role)
          .end(function(error, roleResponse) {
            //TODO: check error and roleResponse.body.error
            var role = roleResponse.body.body;

            //get permissions
            superagent
              .get(process.env.BOLT_ADDRESS + '/api/permissions?app=' + req.params.app)
              .end(function(error, permsResponse){
                //TODO: check error and permsResponse.body.error
                var permissions = permsResponse.body.body;

                //get app-roles
                superagent
                  .get(process.env.BOLT_ADDRESS + '/api/app-roles?app=' + req.params.app + "&role=" + req.params.role)
                  .end(function(error, appRolesResponse) {
                    //TODO: check error and appRolesResponse.body.error
                    var appRoles = appRolesResponse.body.body;
                    var appRole;
                    if (appRoles.length == 1) {
                      appRole = appRoles[0];

                      permissions.forEach(function(permission) {
                        if (appRole.permissions.indexOf(permission.name) != -1) {
                          permission.granted = true;
                        }
                      });
                    }

                    var scope = {
                      app: __app,
                      app_root: req.app_root,
                      bolt_root: process.env.BOLT_ADDRESS,
                      section: __app.displayName + " \u21D2 Access Control \u21D2 " + app.displayName + " (" + app.name + ") \u21D2 Permissions for " + role.displayName,
                      user: req.user,
                      year: __year,

                      current_app: app,
                      permissions: permissions,
                      appRole: appRole,
                      role: role
                    };
                    res
                      .set('Content-type', 'text/html')
                      .render('ac-app-perms.html', scope);
                  });
              });
          });
      });
  }
  else {
    var success = encodeURIComponent(process.env.BOLT_ADDRESS + '/x/' + __app.name + '/ac/permissions/' + req.params.app + '/' + req.params.role);
    res.redirect(process.env.BOLT_ADDRESS + '/login?success=' + success);
  }
});

//-------------apps
app.get('/apps', function (req, res) {
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

app.get('/apps/:name', function (req, res) {
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

app.get('/apps-add', function (req, res) {
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

app.get('/apps-sideload/:path', function (req, res) {
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
app.get('/roles', function (req, res) {
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

app.get('/roles-add', function (req, res) {
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

app.get('/roles/:name', function (req, res) {
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
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/users')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var users = usersResponse.body.body;

      var scope = {
        app: __app,
        bolt:  __bolt,
        user: __user,
        year: __year,

        section: "Users (" + users.length + ")",

        users: users
      };
      res
        .set('Content-type', 'text/html')
        .render('users.html', scope);
    });
});

app.get('/users-add', function (req, res) {
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

app.get('/users/roles/:username', function (req, res) {
  //get user's roles
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/user-roles?user=' + req.params.username)
    .end(function(error, userRolesResponse){
      //TODO: check error and userRolesResponse.body.error
      var userRoles = userRolesResponse.body.body;

      superagent
        .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/roles')
        .end(function(rolesError, rolesResponse){
          var roles = rolesResponse.body.body;
          var indicesToRem = [];
          for(var a = 0; a < userRoles.length; a++) {
            for (var b = 0; b < roles.length; b++) {
              if (userRoles[a].role == roles[b].name) {
                userRoles[a].roleInfo = roles[b];
                indicesToRem.push(b);
                break;
              }
            }
          }
          for(var a = indicesToRem.length - 1; a > -1; --a) {
            roles.splice(indicesToRem[a], 1);
          }
          
          var scope = {
            app: __app,
            bolt:  __bolt,
            user: __user,
            year: __year,

            section: "User's Roles",

            roles: roles,
            rolesHasElements: (roles.length > 0),
            userRoles: userRoles,
            username: req.params.username
          };
          res
            .set('Content-type', 'text/html')
            .render('users-roles.html', scope);
        });
    });
});

app.get('/users/:username', function (req, res) {
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
});

module.exports = app;