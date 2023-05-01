const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('./util/factory')
const deployments = require('../deployments.json')

const getDependencies = async (chainId) => {
  if (chainId !== 31337) {
    return deployments[chainId]
  }

  const [deployer] = await ethers.getSigners()

  const store = await factory.deploy('Store', [deployer.address], deployer.address)
  const npm = await factory.deploy('FakeToken', 'Fake NPM', 'NPM')
  const veNPM = await factory.deploy('VoteEscrowToken', store.address, npm.address, deployer.address, 'Vote Escrow NPM', 'veNPM')
  const gaugeControllerRegistry = await factory.deploy('GaugeControllerRegistry', store.address, deployer.address)

  return { store: store.address, npm: npm.address, veNPM: veNPM.address, gaugeControllerRegistry: gaugeControllerRegistry.address }
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s. Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  let { veNPM, gaugeControllerRegistry, store, liquidityGaugePool, protocol } = await getDependencies(chainId)

  if (!liquidityGaugePool) {
    const contract = await factory.deploy('LiquidityGaugePool', veNPM, gaugeControllerRegistry, store, deployer.address)
    liquidityGaugePool = contract.address
  }

  const iProtocol = await factory.attachAbi(deployer, protocol, 'IProtocol')
  const namespace = ethers.utils.formatBytes32String('cns:pools:liquidity:gauge')
  await iProtocol.addContract(namespace, liquidityGaugePool)

  const registry = await factory.attach(gaugeControllerRegistry, 'GaugeControllerRegistry')
  await registry.setController(liquidityGaugePool)
}

deploy().catch(console.error)
