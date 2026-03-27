const express = require('express')
const router = express.Router()
const viralController = require('../../controllers/web/viralController')

router.post('/fetch', viralController.fetch)
router.post('/rewrite', viralController.rewrite)
router.post('/replicate-images', viralController.replicateImages)

module.exports = router
