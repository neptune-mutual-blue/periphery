const { formatEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const factory = require('../../../specs/util/factory')

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  // 0x0866f9927d94a5D7072E91DcF77E407099170Bf5

  await factory.upgrade('0xd673f97cA6DC3f807E0EAA9d0271b165C2A6d657', 'NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
}

deploy().catch(console.error)
