const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const { boundaries } = require('../../../specs/util/boundaries')
const key = require('../../../specs/util/key')
const deployments = require('../../util/deployments')
const GRIM_WYVERN = 180000
const TOTAL_NFTS = 10_000

const getDependencies = async (deployer, chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const store = await factory.deployUpgradeable('Store', [deployer.address], deployer.address)
  const neptuneLegends = await factory.deployUpgradeable('NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
  const policyProofMinter = await factory.deployUpgradeable('PolicyProofMinter', store.address, neptuneLegends.address, GRIM_WYVERN + 1, GRIM_WYVERN + TOTAL_NFTS, deployer.address)

  return { store: store.address, neptuneLegends: neptuneLegends.address, policyProofMinter: policyProofMinter.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { neptuneLegends, policyProofMinter } = await getDependencies(deployer, chainId)

  const nft = await factory.attach(deployer, neptuneLegends, 'NeptuneLegends')
  const minter = await factory.attach(deployer, policyProofMinter, 'PolicyProofMinter', deployer.address)

  // Set the Policy Proof Minter Contract as a Minter
  await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)
}

deploy().catch(console.error)
