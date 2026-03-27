const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const configController = require('../../controllers/admin/configController')

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `qr_${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

router.get('/', configController.list)
router.put('/', configController.update)
router.post('/upload-qrcode', upload.single('file'), configController.uploadQrcode)

module.exports = router
