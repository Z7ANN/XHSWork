const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const userController = require('../../controllers/web/userController')

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

router.get('/info', userController.getProfile)
router.put('/info', userController.updateProfile)
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar)
router.get('/points', userController.getPointLogs)
router.get('/invites', userController.getInviteList)
router.get('/invite-stats', userController.getInviteStats)
router.post('/bind-invite', userController.bindInviteCode)
router.post('/change-password', userController.changePassword)
router.post('/change-email', userController.changeEmail)

module.exports = router
