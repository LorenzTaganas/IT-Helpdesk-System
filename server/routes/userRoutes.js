const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { getUsers, getUserById, createUser, updateUser } = require('../controllers/userController');

router.use(requireAuth);
router.get('/', requireRole('it_support', 'it_admin', 'super_admin'), getUsers);
router.post('/', requireRole('it_admin', 'super_admin'), createUser);
router.get('/:id', requireRole('it_support', 'it_admin', 'super_admin'), getUserById);
router.patch('/:id', requireRole('it_admin', 'super_admin'), updateUser);

module.exports = router;
