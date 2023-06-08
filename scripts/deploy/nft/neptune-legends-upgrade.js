const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')

const getDependencies = async (deployer, chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const neptuneLegends = await factory.deployUpgradeable('NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
  return { neptuneLegends: neptuneLegends.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()
  const { chainId } = network.config

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  // const { neptuneLegends } = getDependencies(deployer, chainId)
  // console.log(neptuneLegends)
  // process.exit(1)
  await factory.upgrade('0xd673f97cA6DC3f807E0EAA9d0271b165C2A6d657', 'NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
}

deploy().catch(console.error)
