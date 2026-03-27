const express = require('express')
const router = express.Router()
const packageController = require('../../controllers/admin/packageController')

router.get('/', packageController.list)
router.get('/:id', packageController.detail)
router.post('/', packageController.create)
router.put('/:id', packageController.update)
router.delete('/:id', packageController.remove)
router.post('/:id/toggle-status', packageController.toggleStatus)

module.exports = router
