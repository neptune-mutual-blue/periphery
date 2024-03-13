const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')
const pools = require('../../ve/pools.mumbai.json')
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

  const finalLiquidityGaugePools = Array.isArray(liquidityGaugePools) ? liquidityGaugePools : []
  for (const pool of pools) {
    const initializationArgs = {
      key: pool.key,
      stakingToken: pool.stakingToken,
      veToken: veNPM,
      rewardToken: npm,
      registry: gaugeControllerRegistry,
      poolInfo: {
        name: pool.name,
        info: pool.info || '',
        epochDuration: pool.epochDuration,
        veBoostRatio: pool.veBoostRatio,
        platformFee: pool.platformFee,
        treasury: config.treasury
      }
    }

    if (!initializationArgs.poolInfo.info && pool.infoDetails) {
      const info = await ipfs.write(pool.infoDetails)

      initializationArgs.poolInfo.info = info
    }

    const found = Array.isArray(liquidityGaugePools) ? liquidityGaugePools.find(x => x.key.trim().toLowerCase() === pool.key.trim().toLowerCase()) : null

    if (found) {
      console.log('Upgrading Liquidity Gauge Pool: %s', pool.key)

      const instance = await factory.upgrade(found.address, 'LiquidityGaugePool', initializationArgs, config.admin, config.pausers)
      console.log('%s --> %s', pool.key, instance.address)

      return
    }

    console.log('Deploying Liquidity Gauge Pool: %s', pool.key)

    const instance = await factory.deployUpgradeable('LiquidityGaugePool', initializationArgs, config.admin, config.pausers)

    finalLiquidityGaugePools.push({ key: pool.key, address: instance.address })

    console.log('%s --> %s', pool.key, instance.address)
  }

  await deployments.set(chainId, 'liquidityGaugePools', finalLiquidityGaugePools)
}

module.exports = { deploy }
