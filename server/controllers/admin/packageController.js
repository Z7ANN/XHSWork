const { success, error, ErrorCode } = require('../../utils/response')
const packageService = require('../../services/packageService')

const list = async (req, res) => {
  try {
    const { status } = req.query
    const data = await packageService.getAdminPackages({
      status: status !== undefined ? Number(status) : undefined,
    })
    return success(res, data)
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
}

const detail = async (req, res) => {
  try {
    const data = await packageService.getPackageById(Number(req.params.id))
    return success(res, data)
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

const create = async (req, res) => {
  try {
    const { name, type, price, originalPrice, points, vipDays, features, badge, sortOrder, status: pkgStatus } = req.body
    if (!name) return error(res, '套餐名称不能为空', ErrorCode.BAD_REQUEST, 400)
    const id = await packageService.createPackage({ name, type, price, originalPrice, points, vipDays, features, badge, sortOrder, status: pkgStatus })
    return success(res, { id })
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
}

const update = async (req, res) => {
  try {
    await packageService.updatePackage(Number(req.params.id), req.body)
    return success(res)
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

const remove = async (req, res) => {
  try {
    await packageService.deletePackage(Number(req.params.id))
    return success(res)
  } catch (err) {
    const code = err.code || ErrorCode.INTERNAL
    const status = code === ErrorCode.NOT_FOUND ? 404 : code === ErrorCode.BAD_REQUEST ? 400 : 500
    return error(res, err.message, code, status)
  }
}

const toggleStatus = async (req, res) => {
  try {
    const newStatus = await packageService.toggleStatus(Number(req.params.id))
    return success(res, { status: newStatus })
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

module.exports = { list, detail, create, update, remove, toggleStatus }
