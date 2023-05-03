const { deployProtocol } = require('./protocol')
const { deploy } = require('./deployer')
const key = require('../key')

const deployPool = async (signer) => {
  const { npm, store, protocol } = await deployProtocol(signer)

  const primeDappsPod = await deploy('FakeToken', 'Yield Earning USDC', 'iUSDC-PRI')
  const popularDefiAppsPod = await deploy('FakeToken', 'Yield Earning USDC', 'iUSDC-POP')

  const veNpm = await deploy('VoteEscrowToken', store.address, npm.address, signer.address, 'Vote Escrow NPM', 'veNPM')
  const registry = await deploy('GaugeControllerRegistry', store.address, signer.address)

  const candidates = [{
    key: key.toBytes32('prime'),
    pool: {
      name: 'Prime dApps',
      description: 'N/A',
      data: key.toBytes32(''),
      platformFee: 1000,
      staking: {
        pod: primeDappsPod.address,
        lockupPeriodInBlocks: 10_000,
        ratio: 2000
      }
    }
  },
  {
    key: key.toBytes32('popular-defi-apps'),
    pool: {
      name: 'Popular DeFi Apps',
      description: 'N/A',
      data: key.toBytes32(''),
      platformFee: 1500,
      staking: {
        pod: popularDefiAppsPod.address,
        lockupPeriodInBlocks: 10_000,
        ratio: 2000
      }
    }
  }]

  for (const candidate of candidates) {
    await registry.addOrEditPool(candidate.key, candidate.pool)
  }

  return { args: { candidates }, pods: { primeDappsPod, popularDefiAppsPod }, npm, veNpm, store, protocol, registry }
}

module.exports = { deployPool }
