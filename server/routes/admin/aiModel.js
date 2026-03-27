const express = require('express')
const router = express.Router()
const aiModelController = require('../../controllers/admin/aiModelController')

router.get('/', aiModelController.list)
router.post('/', aiModelController.create)
router.post('/upload-icon', ...aiModelController.uploadIcon)
router.put('/:id', aiModelController.update)
router.delete('/:id', aiModelController.remove)

module.exports = router
