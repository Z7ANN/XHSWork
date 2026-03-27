const express = require('express')
const router = express.Router()
const orderController = require('../../controllers/web/orderController')

router.post('/', orderController.create)
router.get('/', orderController.list)
router.get('/:orderNo', orderController.status)
router.post('/:orderNo/cancel', orderController.cancel)

module.exports = router
