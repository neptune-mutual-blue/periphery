const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('./util/factory')
const deployments = require('../deployments.json')

const getDependencies = async (chainId) => {
  if (chainId !== 31337) {
    return deployments[chainId]
  }

  const [deployer] = await ethers.getSigners()

  const store = await factory.deploy('Store', [deployer.address], deployer.address)
  const npm = await factory.deploy('FakeToken', 'Fake NPM', 'NPM')
  const veNPM = await factory.deploy('VoteEscrowToken', store.address, npm.address, deployer.address, 'Vote Escrow NPM', 'veNPM')
  const gaugeControllerRegistry = await factory.deploy('GaugeControllerRegistry', store.address, deployer.address)

  return { store: store.address, npm: npm.address, veNPM: veNPM.address, gaugeControllerRegistry: gaugeControllerRegistry.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s. Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { veNPM, gaugeControllerRegistry, store } = await getDependencies(chainId)
  await factory.deploy('LiquidityGaugePool', veNPM, gaugeControllerRegistry, store, deployer.address)
}

deploy().catch(console.error)
