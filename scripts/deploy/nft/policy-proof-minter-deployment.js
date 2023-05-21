const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../../specs/util/factory')
const deployments = require('../../util/deployments')
const GRIM_WYVERN = 180000
const TOTAL_NFTS = 10_000

const getDependencies = async (deployer, chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const store = await factory.deployUpgradeable('Store', [deployer.address], deployer.address)
  const neptuneLegends = await factory.deployUpgradeable('NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)

  return { store: store.address, neptuneLegends: neptuneLegends.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s. Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { store, neptuneLegends } = await getDependencies(deployer, chainId)

  await factory.deployUpgradeable('PolicyProofMinter', store, neptuneLegends, GRIM_WYVERN + 1, GRIM_WYVERN + TOTAL_NFTS)
}

deploy().catch(console.error)
