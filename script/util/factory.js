const { network, ethers } = require('hardhat')

const deploy = async (contractName, ...args) => {
  const ContractFactory = await ethers.getContractFactory(contractName)
  const instance = await ContractFactory.deploy(...args)
  await instance.deployed()

  const { explorer } = network.config

  if (explorer) {
    console.log('%s Deployed: %s/address/%s', contractName, network.config.explorer, instance.address)
  } else {
    console.log('%s Deployed: %s', contractName, instance.address)
  }

  return instance
}

module.exports = { deploy }
