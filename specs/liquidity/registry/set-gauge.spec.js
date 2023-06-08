const { ethers, network } = require('hardhat')
const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const config = require('../../../scripts/config')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const candidates = [{
  key: key.toBytes32('prime'),
  name: 'Prime dApps',
  info: '',
  platformFee: 1000,
  staking: {
    token: helper.randomAddress(),
    lockupPeriodInBlocks: 10_000,
    ratio: 2000
  }
},
{
  key: key.toBytes32('popular-defi-apps'),
  name: 'Popular DeFi Apps',
  info: '',
  platformFee: 1500,
  staking: {
    token: helper.randomAddress(),
    lockupPeriodInBlocks: 10_000,
    ratio: 2000
  }
}]

describe('Gauge Controller Registry: Set Gauge', () => {
  let contracts, registry, blocksPerEpoch

  before(async () => {
    const [owner] = await ethers.getSigners()
    const { chainId } = network.config
    blocksPerEpoch = config.blockTime.blocksPerEpoch[chainId]

    contracts = await factory.deployProtocol(owner)

    registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, blocksPerEpoch, owner.address, owner.address, [owner.address], contracts.npm.address)

    await registry.addOrEditPools(candidates)
  })

  it('must correctly set distribution', async () => {
    const epoch = 1
    const amountToDeposit = helper.ether(1_000_000)
    const { chainId } = network.config
    const blocksPerEpoch = config.blockTime.blocksPerEpoch[chainId]

    const distribution = candidates.map(x => {
      return {
        key: x.key,
        emission: helper.getRandomNumber(500_000, 4_000_000)
      }
    })

    const [owner] = await ethers.getSigners()
    await contracts.npm.mint(owner.address, amountToDeposit)
    await contracts.npm.approve(registry.address, amountToDeposit)

    const tx = await registry.setGauge(epoch, amountToDeposit, distribution)

    ; (await contracts.npm.balanceOf(registry.address)).should.equal(amountToDeposit)

    ; (await registry.getLastEpoch()).should.equal('1')
    ; (await registry['getEpoch()']()).startBlock.should.equal(tx.blockNumber)
    ; (await registry['getEpoch()']()).endBlock.should.equal(tx.blockNumber + blocksPerEpoch)
    ; (await registry.sumNpmDeposited()).should.equal(amountToDeposit)
    ; (await registry.getAllocation('1')).should.equal(amountToDeposit)

    for (const item of distribution) {
      (await registry.getEmissionPerBlock(item.key)).should.equal(Math.floor(item.emission / blocksPerEpoch))
    }
  })
})
