const express = require('express')
const router = express.Router()
const generationController = require('../../controllers/admin/generationController')

router.get('/stats', generationController.stats)
router.get('/', generationController.list)
router.get('/:id', generationController.detail)
router.delete('/:id', generationController.remove)
router.post('/batch-delete', generationController.batchRemove)

module.exports = router
