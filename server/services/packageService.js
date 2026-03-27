const packageRepository = require('../repositories/packageRepository')
const { createError, ErrorCode } = require('../utils/response')

const validatePackageExists = async (id) => {
  const pkg = await packageRepository.findById(id)
  if (!pkg) throw createError('套餐不存在', ErrorCode.NOT_FOUND)
  return pkg
}

async function getPackages() {
  return packageRepository.findAll()
}

async function getAdminPackages(params) {
  return packageRepository.findAllAdmin(params)
}

async function getPackageById(id) {
  return validatePackageExists(id)
}

async function createPackage(data) {
  return packageRepository.create(data)
}

async function updatePackage(id, data) {
  await validatePackageExists(id)
  await packageRepository.update(id, data)
}

async function deletePackage(id) {
  await validatePackageExists(id)
  const used = await packageRepository.hasOrders(id)
  if (used) throw createError('该套餐已有订单关联，无法删除，请下架', ErrorCode.BAD_REQUEST)
  await packageRepository.remove(id)
}

async function toggleStatus(id) {
  const pkg = await validatePackageExists(id)
  const newStatus = pkg.status === 1 ? 0 : 1
  await packageRepository.update(id, { status: newStatus })
  return newStatus
}

module.exports = { getPackages, getAdminPackages, getPackageById, createPackage, updatePackage, deletePackage, toggleStatus }
