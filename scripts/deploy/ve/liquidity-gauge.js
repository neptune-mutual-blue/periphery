const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')
const config = require('../../config')

const getDependencies = async (chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const [deployer] = await ethers.getSigners()
  const blocksPerEpoch = config.blockTime.blocksPerEpoch[chainId]

  const npm = await factory.deployUpgradeable('FakeToken', 'Fake NPM', 'NPM')
  const veNPM = await factory.deployUpgradeable('VoteEscrowToken', deployer.address, npm.address, deployer.address, 'Vote Escrow NPM', 'veNPM')
  const gaugeControllerRegistry = await factory.deployUpgradeable('GaugeControllerRegistry', blocksPerEpoch, deployer.address, deployer.address, [deployer.address], npm.address)

  return { npm: npm.address, veNPM: veNPM.address, gaugeControllerRegistry: gaugeControllerRegistry.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { npm, veNPM, gaugeControllerRegistry, liquidityGaugePool } = await getDependencies(chainId)

  if (!liquidityGaugePool) {
    await factory.deployUpgradeable('LiquidityGaugePool', deployer.address, veNPM, npm, gaugeControllerRegistry, deployer.address)
    return
  }

  await factory.upgrade(liquidityGaugePool, 'LiquidityGaugePool', deployer.address, veNPM, npm, gaugeControllerRegistry, deployer.address)
}

deploy().catch(console.error)
