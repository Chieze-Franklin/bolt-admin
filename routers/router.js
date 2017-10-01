var express = require('express');
var router = express.Router();

var controller = require('../controllers/controller');
var middleware = require('../controllers/middleware');

router.get('/', controller.getIndex);

router.get('/ac', controller.getAccessControl);

router.get('/ac/:app', controller.getAccessControlForApp);

router.get('/ac/permissions/:app/:role', controller.getAccessControlPermissionsForApp);

router.get('/apps', controller.getApps);

router.get('/apps/:name', controller.getAppByName);

router.post('/hook/bolt/app-starting', controller.postHookBoltAppStarting);

//------404
router.get('*', controller.get404);

module.exports = router;