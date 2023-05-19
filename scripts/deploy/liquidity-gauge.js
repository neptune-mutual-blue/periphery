const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../specs/util/factory')
const deployments = require('../util/deployments')

const getDependencies = async (chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const [deployer] = await ethers.getSigners()

  const npm = await factory.deployUpgradeable('FakeToken', 'Fake NPM', 'NPM')
  const veNPM = await factory.deployUpgradeable('VoteEscrowToken', deployer.address, npm.address, deployer.address, 'Vote Escrow NPM', 'veNPM')
  const gaugeControllerRegistry = await factory.deployUpgradeable('GaugeControllerRegistry', deployer.address, npm.address)

  return { npm: npm.address, veNPM: veNPM.address, gaugeControllerRegistry: gaugeControllerRegistry.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s. Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { npm, veNPM, gaugeControllerRegistry } = await getDependencies(chainId)

  await factory.deployUpgradeable('LiquidityGaugePool', deployer.address, veNPM, npm, gaugeControllerRegistry, deployer.address)
}

deploy().catch(console.error)
