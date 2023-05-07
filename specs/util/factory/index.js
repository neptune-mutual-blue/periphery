const { deploy, deployUpgradeable } = require('./deployer')
const { setGauge } = require('./gauge')
const { deployPool } = require('./pool')
const { deployProtocol } = require('./protocol')
const { deployLiquidityGaugePool } = require('./liquidity-gauge-pool')

module.exports = { deploy, deployUpgradeable, deployPool, deployProtocol, setGauge, deployLiquidityGaugePool }
