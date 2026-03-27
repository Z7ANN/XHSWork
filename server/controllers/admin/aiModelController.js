const { success, error, ErrorCode } = require('../../utils/response')
const aiModelService = require('../../services/aiModelService')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const iconDir = path.join(__dirname, '../../uploads/model-icons')
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: iconDir,
    filename: (req, file, cb) => cb(null, `icon_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 500 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
})

const list = async (req, res) => {
  try {
    const data = await aiModelService.list()
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

const create = async (req, res) => {
  try {
    const data = await aiModelService.create(req.body)
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.BAD_REQUEST ? 400 : 500)
  }
}

const update = async (req, res) => {
  try {
    await aiModelService.updateModel(Number(req.params.id), req.body)
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const remove = async (req, res) => {
  try {
    await aiModelService.remove(Number(req.params.id))
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const uploadIcon = [
  upload.single('icon'),
  async (req, res) => {
    try {
      if (!req.file) return error(res, '请选择图标文件', ErrorCode.BAD_REQUEST, 400)
      return success(res, { url: `/api/uploads/model-icons/${req.file.filename}` })
    } catch (err) {
      return error(res, err.message || '上传失败', ErrorCode.INTERNAL)
    }
  },
]

module.exports = { list, create, update, remove, uploadIcon }
