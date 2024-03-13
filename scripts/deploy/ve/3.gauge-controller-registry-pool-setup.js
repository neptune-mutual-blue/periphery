const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')
const pools = require('../../ve/pools.arbitrum.json')
const ipfs = require('../../../specs/util/ipfs')
const config = require('../../config/accounts.json')

const getDependencies = async (chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const [deployer] = await ethers.getSigners()

  const npm = await factory.deployUpgradeable('FakeToken', 'Fake NPM', 'NPM')
  const veNPM = await factory.deployUpgradeable('VoteEscrowToken', deployer.address, npm.address, deployer.address, 'Vote Escrow NPM', 'veNPM')
  const gaugeControllerRegistry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, deployer.address, deployer.address, [deployer.address], npm.address)

  const liquidityGaugePools = []

  for (const pool of pools) {
    pool.veToken = veNPM.address
    pool.rewardToken = npm.address
    pool.registry = gaugeControllerRegistry.address
    const info = await ipfs.write(pool.infoDetails)
    pool.info = info

    const instance = await factory.deployUpgradeable('LiquidityGaugePool', pool, config.admin, [])
    liquidityGaugePools.push({ key: pool.key, address: instance.address })
  }

  return { npm: npm.address, veNPM: veNPM.address, gaugeControllerRegistry: gaugeControllerRegistry.address, liquidityGaugePools }
}

const setup = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { gaugeControllerRegistry, liquidityGaugePools } = await getDependencies(chainId)

  const registry = await factory.attach(deployer, gaugeControllerRegistry, 'GaugeControllerRegistry')
  await registry.addOrEditPools(liquidityGaugePools.map(x => x.address))
}

module.exports = { setup }
