const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')

const getDependencies = async (deployer, chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const neptuneLegends = await factory.deployUpgradeable('NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
  const npm = await factory.deployUpgradeable('FakeToken', 'Fake NPM', 'NPM')

  return { neptuneLegends: neptuneLegends.address, npm: npm.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config

  const { neptuneLegends, merkleProofMinter, npm } = await getDependencies(deployer, chainId)

  if (!merkleProofMinter) {
    await factory.deployUpgradeable('MerkleProofMinter', neptuneLegends, npm, deployer.address, deployer.address)
    return
  }

  await factory.upgrade(merkleProofMinter, 'MerkleProofMinter', neptuneLegends, npm, deployer.address, deployer.address)
}

deploy().catch(console.error)
