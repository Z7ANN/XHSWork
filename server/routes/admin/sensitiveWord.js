const express = require('express')
const router = express.Router()
const controller = require('../../controllers/admin/sensitiveWordController')

router.get('/', controller.list)
router.post('/', controller.create)
router.post('/batch', controller.batchCreate)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

module.exports = router
