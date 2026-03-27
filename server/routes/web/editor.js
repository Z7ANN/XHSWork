const express = require('express')
const router = express.Router()
const editorController = require('../../controllers/web/editorController')

// 获取用户可用模型
router.get('/models', editorController.getModels)
// 一键生成流程（原 oneclick）
router.post('/analyze-style', editorController.analyzeStyleHandler)
router.post('/outline', editorController.outline)
router.post('/generate-images', editorController.generateImagesHandler)
router.post('/retry-image', editorController.retryImage)
router.post('/content', editorController.content)

// 编辑器 AI 辅助
router.post('/generate', editorController.generate)

// 一键发布
router.post('/publish', editorController.publish)

// AI 编辑辅助
router.post('/ai-assist', editorController.aiAssist)

// 违禁词检测
router.post('/check-sensitive', editorController.checkSensitive)

// 生成记录
router.post('/save', editorController.save)
router.put('/save/:id', editorController.update)
router.get('/history', editorController.history)
router.get('/history/:id', editorController.historyDetail)
router.delete('/history/:id', editorController.historyDelete)

module.exports = router
