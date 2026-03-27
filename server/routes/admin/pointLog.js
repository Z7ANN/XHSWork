const express = require('express')
const router = express.Router()
const controller = require('../../controllers/admin/pointLogController')

router.get('/', controller.list)

module.exports = router
