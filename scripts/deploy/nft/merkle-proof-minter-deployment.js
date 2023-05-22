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

  console.log('Deployer: %s. Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { neptuneLegends } = await getDependencies(deployer, chainId)

  await factory.deployUpgradeable('MerkleProofMinter', neptuneLegends, deployer.address, deployer.address)
}

deploy().catch(console.error)
