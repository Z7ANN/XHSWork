const express = require('express')
const router = express.Router()
const { success, error, ErrorCode } = require('../../utils/response')
const packageService = require('../../services/packageService')
const aiModelRepository = require('../../repositories/aiModelRepository')

router.get('/', async (req, res) => {
  try {
    const list = await packageService.getPackages()
    return success(res, list)
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL, 500)
  }
})

router.get('/points-rules', async (req, res) => {
  try {
    const textModels = await aiModelRepository.findEnabled('text', 'all')
    const imageModels = await aiModelRepository.findEnabled('image', 'all')
    const textMin = textModels.length ? Math.min(...textModels.map(m => m.pointsCost)) : 1
    const imageMin = imageModels.length ? Math.min(...imageModels.map(m => m.pointsCost)) : 5
    return success(res, { text: textMin, image: imageMin })
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL, 500)
  }
})

module.exports = router
