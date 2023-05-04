const hre = require('hardhat')

const deploy = async (contractName, ...args) => {
  const ContractFactory = await hre.ethers.getContractFactory(contractName)
  const instance = await ContractFactory.deploy(...args)
  return instance.deployed()
}

module.exports = { deploy }
