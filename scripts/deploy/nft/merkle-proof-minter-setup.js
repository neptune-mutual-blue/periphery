const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const { boundaries } = require('../../../specs/util/boundaries')
const key = require('../../../specs/util/key')
const deployments = require('../../util/deployments')

const getDependencies = async (deployer, chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const neptuneLegends = await factory.deployUpgradeable('NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
  const merkleProofMinter = await factory.deployUpgradeable('MerkleProofMinter', neptuneLegends.address, deployer.address, deployer.address)

  return { neptuneLegends: neptuneLegends.address, merkleProofMinter: merkleProofMinter.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s. Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { neptuneLegends, merkleProofMinter } = await getDependencies(deployer, chainId)

  const nft = await factory.attach(deployer, neptuneLegends, 'NeptuneLegends')
  const minter = await factory.attach(deployer, merkleProofMinter, 'MerkleProofMinter')

  // Set the Merkle Proof Minter Contract as a Minter
  await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)

  // Set boundaries
  await minter.setBoundaries(...boundaries)
}

deploy().catch(console.error)
