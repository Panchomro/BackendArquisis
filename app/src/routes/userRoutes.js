const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

router.post('/user/new', UserController.createUser);

router.get('/user/:id', UserController.getUser);

router.patch('/user/:id/update', UserController.updateUser);

module.exports = router;