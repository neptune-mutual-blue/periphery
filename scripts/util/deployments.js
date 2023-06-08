const deployments = require('../../deployments.json')

const get = async (chainId) => {
  if (chainId === 31337) {
    return null
  }

  console.log(chainId)
  console.log(deployments, deployments[chainId.toString()])

  return deployments[chainId.toString()]
}

module.exports = { get }
