const { ethers } = require('hardhat')
const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Add Pool', () => {
  let contracts, registry

  before(async () => {
    const [owner] = await ethers.getSigners()

    contracts = await factory.deployProtocol(owner)

    registry = await factory.deploy('GaugeControllerRegistry', contracts.store.address, owner.address)
  })

  it('must correctly add a new pool', async () => {
    const k = key.toBytes32('prime')

    const pool = {
      name: 'Prime dApps',
      description: 'N/A',
      data: key.toBytes32(''),
      platformFee: 1000,
      staking: {
        pod: helper.randomAddress(),
        lockupPeriodInBlocks: 10_000,
        ratio: 2000
      }
    }

    await registry.addOrEditPool(k, pool)

    const result = await registry.get(k)

    result.name.should.equal(pool.name)
    result.description.should.equal(pool.description)
    result.data.should.equal(pool.data)
    result.platformFee.should.equal(pool.platformFee)
    result.staking.pod.should.equal(pool.staking.pod)
    result.staking.lockupPeriodInBlocks.should.equal(pool.staking.lockupPeriodInBlocks)
    result.staking.ratio.should.equal(pool.staking.ratio)
  })
})
