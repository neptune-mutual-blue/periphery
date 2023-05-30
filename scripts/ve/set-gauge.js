const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../specs/util/factory')
const deployments = require('../util/deployments')
const config = require('../config')
const { pools } = require('./pools')
const chalk = require('chalk')
const toChunks = (array, size) => Array(Math.ceil(array.length / size)).fill().map((_, index) => index * size).map(begin => array.slice(begin, begin + size))
const CHUNK_SIZE = 4

const getDependencies = async (deployer, chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const blocksPerEpoch = config.blockTime.blocksPerEpoch[chainId]
  const npm = await factory.deployUpgradeable('FakeToken', 'Fake NPM', 'NPM')
  const gaugeControllerRegistry = await factory.deployUpgradeable('GaugeControllerRegistry', blocksPerEpoch, deployer.address, deployer.address, [deployer.address], npm.address)

  return { npm: npm.address, gaugeControllerRegistry: gaugeControllerRegistry.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const gauges = pools[chainId]

  if (!gauges) {
    console.log(chalk.red('Pool missing for network:', chainId))
    return
  }

  const { gaugeControllerRegistry } = await getDependencies(deployer, chainId)

  const registry = await factory.attach(deployer, gaugeControllerRegistry, 'GaugeControllerRegistry')

  const chunks = toChunks(gauges, CHUNK_SIZE)

  for (const chunk of chunks) {
    await registry.addOrEditPools(chunk)
  }
}

deploy().catch(console.error)
