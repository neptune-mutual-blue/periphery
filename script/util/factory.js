const path = require('path')
const { ethers } = require('ethers')
const hre = require('hardhat')
const io = require('./io')

const getAbiFromFileName = async (filename) => {
  const file = path.join(process.cwd(), 'abis', `${filename}.json`)

  if (io.exists(file)) {
    return io.readFile(file)
  }

  throw new Error(`Could not locate ABI at path: ${file}`)
}

const attach = async (at, contractName, libraries) => {
  const contract = libraries ? await hre.ethers.getContractFactory(contractName, libraries) : await hre.ethers.getContractFactory(contractName)
  return contract.attach(at)
}

const attachAbi = async (provider, at, file) => {
  const abi = await getAbiFromFileName(file)
  return new ethers.Contract(at, abi, provider)
}

const deploy = async (contractName, ...args) => {
  const ContractFactory = await hre.ethers.getContractFactory(contractName)
  const instance = await ContractFactory.deploy(...args)
  await instance.deployed()

  const { explorer } = hre.network.config

  if (explorer) {
    console.log('%s Deployed: %s/address/%s', contractName, hre.network.config.explorer, instance.address)
  } else {
    console.log('%s Deployed: %s', contractName, instance.address)
  }

  return instance
}

module.exports = { deploy, attach, attachAbi }
