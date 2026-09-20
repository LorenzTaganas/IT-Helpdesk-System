const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const {
  createAsset,
  getAssets,
  getAssetStats,
  getAssignableUsers,
  getAssetById,
  updateAsset,
} = require('../controllers/assetController');

router.use(requireAuth);
router.get('/', getAssets);
router.get('/stats', getAssetStats);
router.get('/users', requireRole('it_support', 'it_admin', 'super_admin'), getAssignableUsers);
router.post('/', requireRole('it_support', 'it_admin', 'super_admin'), createAsset);
router.get('/:id', getAssetById);
router.patch('/:id', requireRole('it_support', 'it_admin', 'super_admin'), updateAsset);

module.exports = router;
