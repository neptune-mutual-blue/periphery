const { ethers, upgrades } = require('hardhat')

const deploy = async (contractName, ...args) => {
  const ContractFactory = await ethers.getContractFactory(contractName)
  const instance = await ContractFactory.deploy(...args)
  return instance.deployed()
}

const deployUpgradeable = async (contractName, ...args) => {
  const ContractFactory = await ethers.getContractFactory(contractName)
  const instance = await upgrades.deployProxy(ContractFactory, args)
  await instance.deployed()

  return instance
}

module.exports = { deploy, deployUpgradeable }
