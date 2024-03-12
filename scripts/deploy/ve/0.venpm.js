const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')
const config = require('../../config/accounts.json')

const getDependencies = async (chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const npm = await factory.deployUpgradeable('FakeToken', 'Fake NPM', 'NPM')

  return { npm: npm.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  config.admin = deployer.address

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))
  const { chainId } = network.config
  const { npm, veNpm } = await getDependencies(chainId)

  if (!veNpm) {
    const instance = await factory.deployUpgradeable('VoteEscrowToken', config.admin, npm, config.treasury, 'Vote Escrow NPM', 'veNPM')
    await deployments.set(chainId, 'veNPM', instance.address)
    return
  }

  await factory.upgrade(veNpm, 'VoteEscrowToken', config.admin, npm, config.treasury, 'Vote Escrow NPM', 'veNPM')
}

module.exports = { deploy }
