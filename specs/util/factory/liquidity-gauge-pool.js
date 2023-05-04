const { setGauge } = require('./gauge')
const { deploy } = require('./deployer')

const deployLiquidityGaugePool = async (signer) => {
  const contracts = await setGauge(signer)

  const gaugePool = await deploy('LiquidityGaugePool', contracts.veNpm.address, contracts.npm.address, contracts.registry.address, contracts.store.address, signer.address)

  contracts.gaugePool = gaugePool
  return contracts
}

module.exports = { deployLiquidityGaugePool }
