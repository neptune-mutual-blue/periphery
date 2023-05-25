const { attach, deploy, deployUpgradeable, upgrade } = require('./deployer')
const { setGauge } = require('./gauge')
const { deployPool } = require('./pool')
const { deployProtocol } = require('./protocol')
const { deployLiquidityGaugePool } = require('./liquidity-gauge-pool')

module.exports = { attach, deploy, deployUpgradeable, upgrade, deployPool, deployProtocol, setGauge, deployLiquidityGaugePool }
