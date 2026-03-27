const express = require('express')
const router = express.Router()
const redeemController = require('../../controllers/admin/redeemController')

router.get('/', redeemController.list)
router.post('/', redeemController.create)
router.delete('/:id', redeemController.remove)

module.exports = router
