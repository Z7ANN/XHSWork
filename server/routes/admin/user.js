const express = require('express')
const router = express.Router()
const userController = require('../../controllers/admin/userController')

router.get('/', userController.list)
router.get('/:id', userController.detail)
router.put('/:id/status', userController.updateStatus)
router.post('/:id/adjust-points', userController.adjustPoints)
router.post('/:id/set-vip', userController.setVip)
router.post('/:id/reset-password', userController.resetPassword)

module.exports = router
