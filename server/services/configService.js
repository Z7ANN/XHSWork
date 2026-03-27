const configRepository = require('../repositories/configRepository')

async function getConfigs() {
  return configRepository.findAll()
}

async function updateConfigs(configs) {
  await configRepository.batchUpdate(configs)
}

module.exports = { getConfigs, updateConfigs }
