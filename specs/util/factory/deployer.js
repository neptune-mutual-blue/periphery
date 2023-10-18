const { ethers, upgrades, network } = require('hardhat')

const attach = async (connectedTo, at, contractName, libraries) => {
  const contract = libraries ? await ethers.getContractFactory(contractName, libraries) : await ethers.getContractFactory(contractName)
  return contract.connect(connectedTo).attach(at)
}

const deploy = async (contractName, ...args) => {
  const ContractFactory = await ethers.getContractFactory(contractName)
  const instance = await ContractFactory.deploy(...args)
  await instance.deployed()

  const { explorer } = network.config

  if (explorer) {
    console.log('%s Deployed: %s/address/%s', contractName, network.config.explorer, instance.address)
  }

  return instance
}

const deployUpgradeable = async (contractName, ...args) => {
  const ContractFactory = await ethers.getContractFactory(contractName)
  const instance = await upgrades.deployProxy(ContractFactory, args)
  await instance.deployed()

  const { explorer } = network.config

  if (explorer) {
    console.log('%s Deployed: %s/address/%s', contractName, network.config.explorer, instance.address)
  }

  return instance
}

const upgrade = async (existingAddress, newContractName, ...args) => {
  const ContractFactory = await ethers.getContractFactory(newContractName)
  const instance = await upgrades.upgradeProxy(existingAddress, ContractFactory, args)
  await instance.deployed()

  const { explorer } = network.config

  if (explorer) {
    console.log('%s Upgrade Deployed: %s/address/%s', newContractName, network.config.explorer, instance.address)
  }

  return instance
}

const validateUpgrade = async (oldContractName, newContractName) => {
  const OldContractFactory = await ethers.getContractFactory(oldContractName)
  const NewContractFactory = await ethers.getContractFactory(newContractName)

  await upgrades.validateUpgrade(OldContractFactory, NewContractFactory)
}

module.exports = { attach, deploy, deployUpgradeable, upgrade, validateUpgrade }
