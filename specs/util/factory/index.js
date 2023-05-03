const { deploy } = require('./deployer')
const { setGauge } = require('./gauge')
const { deployPool } = require('./pool')
const { deployProtocol } = require('./protocol')
const { deployLiquidityGaugePool } = require('./liquidity-gauge-pool')

module.exports = { deploy, deployPool, deployProtocol, setGauge, deployLiquidityGaugePool }
