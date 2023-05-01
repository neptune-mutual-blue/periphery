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

  return { store: store.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s. Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { store } = await getDependencies(chainId)

  await factory.deploy('GaugeControllerRegistry', store, deployer.address)
}

deploy().catch(console.error)
