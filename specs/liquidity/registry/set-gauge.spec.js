const { ethers } = require('hardhat')
const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const candidates = [{
  key: key.toBytes32('prime'),
  pool: {
    name: 'Prime dApps',
    info: '',
    platformFee: 1000,
    staking: {
      pod: helper.randomAddress(),
      lockupPeriodInBlocks: 10_000,
      ratio: 2000
    }
  }
},
{
  key: key.toBytes32('popular-defi-apps'),
  pool: {
    name: 'Popular DeFi Apps',
    info: '',
    platformFee: 1500,
    staking: {
      pod: helper.randomAddress(),
      lockupPeriodInBlocks: 10_000,
      ratio: 2000
    }
  }
}]

describe('Gauge Controller Registry: Set Gauge', () => {
  let contracts, registry

  before(async () => {
    const [owner] = await ethers.getSigners()

    contracts = await factory.deployProtocol(owner)

    registry = await factory.deployUpgradeable('GaugeControllerRegistry', owner.address, contracts.store.address)

    for (const candidate of candidates) {
      await registry.addOrEditPool(candidate.key, candidate.pool)
    }
  })

  it('must correctly set distribution', async () => {
    const epoch = 1
    const amountToDeposit = helper.ether(1_000_000)

    const distribution = candidates.map(x => {
      return {
        key: x.key,
        emissionPerBlock: helper.getRandomNumber(500_000, 4_000_000)
      }
    })

    const [owner] = await ethers.getSigners()
    await contracts.npm.mint(owner.address, amountToDeposit)
    await contracts.npm.approve(registry.address, amountToDeposit)

    await registry.setGauge(epoch, amountToDeposit, distribution)

    ; (await contracts.npm.balanceOf(registry.address)).should.equal(amountToDeposit)

    ; (await registry.getLastEpoch()).should.equal('1')
    ; (await registry.getAllocation('1')).should.equal(amountToDeposit)
    ; (await registry.sumNpmDeposited()).should.equal(amountToDeposit)

    for (const item of distribution) {
      (await registry.getEmissionPerBlock(item.key)).should.equal(item.emissionPerBlock)
    }
  })
})
