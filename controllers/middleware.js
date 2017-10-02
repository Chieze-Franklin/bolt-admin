var request = require('request');

var controller = require('./controller');

var year = new Date().getFullYear();

var middleware = {
	checkForEditAccessControlPermission: function(req, res, next) {
		request.post({
			url: process.env.BOLT_ADDRESS + '/api/checks/has-permission',
			json: { app: controller.getAppName(), permission: 'edit-access-control', user: req.user.name }}, 
			function(error, response, body) {
				if (body.body.result) {
					next();
				}
				else {
					var scope = {
						app_name: controller.getAppName(),
						app_root: req.app_root,
						bolt_root: process.env.BOLT_ADDRESS,
						user: req.user,
						year: year
					};
					res.render('403', scope);
				}
			});
	},
	checkForEditAppsPermission: function(req, res, next) {
		request.post({
			url: process.env.BOLT_ADDRESS + '/api/checks/has-permission',
			json: { app: controller.getAppName(), permission: 'edit-installed-apps', user: req.user.name }}, 
			function(error, response, body) {
				if (body.body.result) {
					next();
				}
				else {
					var scope = {
						app_name: controller.getAppName(),
						app_root: req.app_root,
						bolt_root: process.env.BOLT_ADDRESS,
						user: req.user,
						year: year
					};
					res.render('403', scope);
				}
			});
	},
	checkForEditRolesPermission: function(req, res, next) {
		request.post({
			url: process.env.BOLT_ADDRESS + '/api/checks/has-permission',
			json: { app: controller.getAppName(), permission: 'edit-roles', user: req.user.name }}, 
			function(error, response, body) {
				if (body.body.result) {
					next();
				}
				else {
					var scope = {
						app_name: controller.getAppName(),
						app_root: req.app_root,
						bolt_root: process.env.BOLT_ADDRESS,
						user: req.user,
						year: year
					};
					res.render('403', scope);
				}
			});
	},
	checkForEditUsersPermission: function(req, res, next) {
		request.post({
			url: process.env.BOLT_ADDRESS + '/api/checks/has-permission',
			json: { app: controller.getAppName(), permission: 'edit-users', user: req.user.name }}, 
			function(error, response, body) {
				if (body.body.result) {
					next();
				}
				else {
					var scope = {
						app_name: controller.getAppName(),
						app_root: req.app_root,
						bolt_root: process.env.BOLT_ADDRESS,
						user: req.user,
						year: year
					};
					res.render('403', scope);
				}
			});
	}
};

module.exports = middleware;