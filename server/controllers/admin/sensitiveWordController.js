const { success, error, ErrorCode } = require('../../utils/response')
const sensitiveWordService = require('../../services/sensitiveWordService')

const list = async (req, res) => {
  try {
    const data = await sensitiveWordService.list(req.query)
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

const create = async (req, res) => {
  try {
    const data = await sensitiveWordService.create(req.body)
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.BAD_REQUEST ? 400 : 500)
  }
}

const update = async (req, res) => {
  try {
    await sensitiveWordService.update(Number(req.params.id), req.body)
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const remove = async (req, res) => {
  try {
    await sensitiveWordService.remove(Number(req.params.id))
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

const batchCreate = async (req, res) => {
  try {
    await sensitiveWordService.batchCreate(req.body.words || [])
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

module.exports = { list, create, update, remove, batchCreate }
