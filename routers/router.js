var express = require('express');
var router = express.Router();

var controller = require('../controllers/controller');
var middleware = require('../controllers/middleware');

router.get('/', controller.getIndex);

router.get('/ac', middleware.checkForEditAccessControlPermission, controller.getAccessControl);

router.get('/ac/:app', middleware.checkForEditAccessControlPermission, controller.getAccessControlForApp);

router.get('/ac/permissions/:app/:role', middleware.checkForEditAccessControlPermission, controller.getAccessControlPermissionsForApp);

router.get('/apps', middleware.checkForEditAppsPermission, controller.getApps);

router.get('/apps/:name', middleware.checkForEditAppsPermission, controller.getAppByName);

router.get('/roles', middleware.checkForEditRolesPermission, controller.getRoles);

router.get('/roles/:name', middleware.checkForEditRolesPermission, controller.getRoleByName);

router.get('/roles/edit/:name', middleware.checkForEditRolesPermission, controller.getEditRole);

router.get('/roles-add', middleware.checkForEditRolesPermission, controller.getAddRole);

router.get('/users', middleware.checkForEditUsersPermission, controller.getUsers);

router.get('/users/roles/:name', middleware.checkForEditUsersPermission, controller.getUserRoles);

router.get('/users/:name', middleware.checkForEditUsersPermission, controller.getUserByName);

router.get('/users-add', middleware.checkForEditUsersPermission, controller.getAddUser);

router.post('/hook/bolt/app-starting', controller.postHookBoltAppStarting);

//------404
router.get('*', controller.get404);

module.exports = router;