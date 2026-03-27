const express = require('express')
const router = express.Router()
const orderController = require('../../controllers/admin/orderController')

router.get('/', orderController.list)
router.post('/:orderNo/cancel', orderController.cancel)
router.post('/:orderNo/complete', orderController.complete)

module.exports = router
