const { attach, deploy, deployUpgradeable, upgrade, validateUpgrade } = require('./deployer')
const { deployProtocol } = require('./protocol')

module.exports = { attach, deploy, deployUpgradeable, upgrade, deployProtocol, validateUpgrade }
