const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { getDepartments, createDepartment, updateDepartment } = require('../controllers/departmentController');

router.use(requireAuth);
router.get('/', requireRole('it_support', 'it_admin', 'super_admin'), getDepartments);
router.post('/', requireRole('it_admin', 'super_admin'), createDepartment);
router.patch('/:id', requireRole('it_admin', 'super_admin'), updateDepartment);

module.exports = router;
