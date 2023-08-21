const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')
const pools = require('../../ve/pools.baseGoerli.json')
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

  return { npm: npm.address, veNPM: veNPM.address, gaugeControllerRegistry: gaugeControllerRegistry.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { npm, veNPM, gaugeControllerRegistry, liquidityGaugePools } = await getDependencies(chainId)

  if (!liquidityGaugePools || liquidityGaugePools.length === 0) {
    for (const pool of pools) {
      const info = await ipfs.write(pool.infoDetails)

      pool.veToken = veNPM
      pool.rewardToken = npm
      pool.registry = gaugeControllerRegistry
      pool.info = info

      const instance = await factory.deployUpgradeable('LiquidityGaugePool', pool, config.admin, [])
      console.log('%s --> %s', pool.key, instance.address)
    }

    return
  }

  console.log('Upgrading Liquidity Gauge Pools')

  for (const pool of pools) {
    pool.veToken = veNPM
    pool.rewardToken = npm
    pool.registry = gaugeControllerRegistry

    const current = liquidityGaugePools.find(x => x.key === pool.key)

    const instance = await factory.upgrade(current.address, 'LiquidityGaugePool', pool, config.admin, [])
    console.log('%s --> %s', pool.key, instance.address)
  }
}

deploy().catch(console.error)
