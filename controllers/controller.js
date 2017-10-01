var request = require('request');
var superagent = require('superagent');

var utils = require("bolt-internal-utils");

var appname, apptoken, appdisplayname = "System Admin", year = new Date().getFullYear();

var controller = {
	get403: function(req, res) {
		res.render('403', {
			app_root: req.app_root,
			bolt_root: process.env.BOLT_ADDRESS
		});
	},

	get404: function(req, res) {
		res.render('404', {
			app_root: req.app_root,
			bolt_root: process.env.BOLT_ADDRESS
		});
	},
	
	getAppName: function() {
		return appname;
	},

	getIndex: function(req, res){
		var scope = {
			app_display_name: appdisplayname,
			app_name: appname,
			app_root: req.app_root,
			app_token: apptoken,
			bolt_root: process.env.BOLT_ADDRESS,
			section: appdisplayname,
			user: req.user,
			year: year
		};
		res
			.set('Content-type', 'text/html')
			.render('index.html', scope);
	},

	getAccessControl: function(req, res){
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
					app_display_name: appdisplayname,
					app_name: appname,
					app_root: req.app_root,
					app_token: apptoken,
					bolt_root: process.env.BOLT_ADDRESS,
					section: appdisplayname + " \u21D2 Access Control",
					user: req.user,
					year: year,

					apps: apps
				};
				res
					.set('Content-type', 'text/html')
					.render('ac.html', scope);
			});
	},

	getAccessControlForApp: function(req, res){
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
								indicesToRemove = appRoles.map(function(appRl, idx){
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
									app_display_name: appdisplayname,
									app_name: appname,
									app_root: req.app_root,
									app_token: apptoken,
									bolt_root: process.env.BOLT_ADDRESS,
									section: appdisplayname + " \u21D2 Access Control \u21D2 " + app.displayName + " (" + app.name + ")",
									user: req.user,
									year: year,

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
	},

	getAccessControlPermissionsForApp: function(req, res){
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

											if (permissions) {
												permissions.forEach(function(permission) {
													if (appRole.permissions.indexOf(permission.name) != -1) {
														permission.granted = true;
													}
												});
											}
										}

										var scope = {
											app_display_name: appdisplayname,
											app_name: appname,
											app_root: req.app_root,
											app_token: apptoken,
											bolt_root: process.env.BOLT_ADDRESS,
											section: appdisplayname + " \u21D2 Access Control \u21D2 " + app.displayName + " (" + app.name + ") \u21D2 Permissions for " + role.displayName,
											user: req.user,
											year: year,

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
	},

	getApps: function(req, res){
		//get registered apps
		superagent
			.get(process.env.BOLT_ADDRESS + '/api/apps')
			.end(function(error, appsResponse){
				//TODO: check error and appsResponse.body.error
				var apps = appsResponse.body.body;
				//TODO: check if app has updates, show the Update button if true

				var scope = {
					app_display_name: appdisplayname,
					app_name: appname,
					app_root: req.app_root,
					app_token: apptoken,
					bolt_root: process.env.BOLT_ADDRESS,
					section: appdisplayname + " \u21D2 Apps (" + apps.length + ")",
					user: req.user,
					year: year,

					apps: apps
				};
				res
					.set('Content-type', 'text/html')
					.render('apps.html', scope);
			});
	},

	getAppByName: function(req, res){
		//get app
		superagent
			.get(process.env.BOLT_ADDRESS + '/api/apps/' + req.params.name)
			.end(function(error, appResponse){
				//TODO: check error and appResponse.body.error
				var app = appResponse.body.body;
				//TODO: get if app is outdated
				var outdated = false;

				var scope = {
					app_display_name: appdisplayname,
					app_name: appname,
					app_root: req.app_root,
					app_token: apptoken,
					bolt_root: process.env.BOLT_ADDRESS,
					section: appdisplayname + " \u21D2 Apps  \u21D2 <unrecognised app>",
					user: req.user,
					year: year
				};
				if (app) {
					scope.section = appdisplayname + " \u21D2 Apps  \u21D2 " + app.displayName + " (" + app.name + ")";
					scope.current_app = app;
					scope.outdated = outdated;
				}

				res
					.set('Content-type', 'text/html')
					.render('app.html', scope);
			});
	},

	getRoles: function(req, res){
		//get registered roles
		superagent
			.get(process.env.BOLT_ADDRESS + '/api/roles')
			.end(function(error, rolesResponse){
				//TODO: check error and rolesResponse.body.error
				var roles = rolesResponse.body.body;
				//TODO: check if app has updates, show the Update button if true

				var scope = {
					app_display_name: appdisplayname,
					app_name: appname,
					app_root: req.app_root,
					app_token: apptoken,
					bolt_root: process.env.BOLT_ADDRESS,
					section: appdisplayname + " \u21D2 Roles (" + roles.length + ")",
					user: req.user,
					year: year,

					roles: roles
				};
				res
					.set('Content-type', 'text/html')
					.render('roles.html', scope);
			});
	},

	getRoleByName: function(req, res){
		//get role
		superagent
			.get(process.env.BOLT_ADDRESS + '/api/roles/' + req.params.name)
			.end(function(error, appResponse){
				//TODO: check error and appResponse.body.error
				var role = appResponse.body.body;

				var scope = {
					app_display_name: appdisplayname,
					app_name: appname,
					app_root: req.app_root,
					app_token: apptoken,
					bolt_root: process.env.BOLT_ADDRESS,
					section: appdisplayname + " \u21D2 Roles  \u21D2 <unrecognised role>",
					user: req.user,
					year: year
				};
				if (role) {
					scope.section = appdisplayname + " \u21D2 Roles  \u21D2 " + role.displayName;
					scope.role = role;
				}

				res
					.set('Content-type', 'text/html')
					.render('role.html', scope);
			});
	},

	getAddRole: function(req, res){
		var scope = {
			app_display_name: appdisplayname,
			app_name: appname,
			app_root: req.app_root,
			app_token: apptoken,
			bolt_root: process.env.BOLT_ADDRESS,
			section: appdisplayname + " \u21D2 Roles \u21D2 New Role",
			user: req.user,
			year: year
		};
		res
			.set('Content-type', 'text/html')
			.render('roles-add.html', scope);
	},

	getEditRole: function(req, res){
		//get role
		superagent
			.get(process.env.BOLT_ADDRESS + '/api/roles/' + req.params.name)
			.end(function(error, appResponse){
				//TODO: check error and appResponse.body.error
				var role = appResponse.body.body;

				var scope = {
					app_display_name: appdisplayname,
					app_name: appname,
					app_root: req.app_root,
					app_token: apptoken,
					bolt_root: process.env.BOLT_ADDRESS,
					section: appdisplayname + " \u21D2 Roles  \u21D2 Edit Role",
					user: req.user,
					year: year,

					role: role
				};

				res
					.set('Content-type', 'text/html')
					.render('roles-edit.html', scope);
			});
	},

	postHookBoltAppStarting: function(req, res){
		var event = req.body;
		appname = event.body.appName;
		apptoken = event.body.appToken;
	}
};

module.exports = controller;