const { formatEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const factory = require('../../../specs/util/factory')

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  await factory.deployUpgradeable('NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
}

deploy().catch(console.error)
