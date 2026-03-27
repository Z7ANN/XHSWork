const userRepository = require('../repositories/userRepository')
const generationRepository = require('../repositories/generationRepository')
const orderRepository = require('../repositories/orderRepository')
const redeemRepository = require('../repositories/redeemRepository')
const pointRepository = require('../repositories/pointRepository')

async function getStats() {
  const [
    totalUsers, todayUsers,
    generationsByType, todayGenerations, totalGenerations,
    orderStats, redeemStats, pointStats,
  ] = await Promise.all([
    userRepository.count(),
    userRepository.countToday(),
    generationRepository.countByType(),
    generationRepository.countToday(),
    generationRepository.countTotal(),
    orderRepository.statsForDashboard(),
    redeemRepository.statsForDashboard(),
    pointRepository.statsForDashboard(),
  ])

  const byType = {}
  for (const row of generationsByType) byType[row.type] = row.count
  const todayByType = {}
  for (const row of todayGenerations) todayByType[row.type] = row.count

  return {
    users: { total: totalUsers, today: todayUsers },
    generations: { total: totalGenerations, byType, todayByType },
    orders: orderStats,
    redeems: redeemStats,
    points: pointStats,
  }
}

module.exports = { getStats }
