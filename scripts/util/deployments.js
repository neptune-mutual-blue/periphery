const path = require('path')
const io = require('./io')

const filepath = path.resolve(__dirname, '../../deployments.json')

const get = async (chainId) => {
  if (chainId === 31337) {
    return null
  }

  const content = await io.readFile(filepath)
  const deployments = JSON.parse(content)

  return deployments[chainId.toString()]
}

const set = async (chainId, key, value) => {
  const content = await io.readFile(filepath)
  const deployments = JSON.parse(content)
  deployments[chainId][key] = value

  await io.saveToDisk(filepath, deployments)
}

module.exports = { get, set }
