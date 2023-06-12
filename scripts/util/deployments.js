const deployments = require('../../deployments.json')

const get = async (chainId) => {
  if (chainId === 31337) {
    return null
  }

  return deployments[chainId.toString()]
}

module.exports = { get }
