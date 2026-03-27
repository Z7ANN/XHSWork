const express = require('express')
const router = express.Router()
const coverController = require('../../controllers/web/coverController')

router.post('/generate', coverController.generate)

module.exports = router
