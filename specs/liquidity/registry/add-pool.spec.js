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
    registry = await factory.deployUpgradeable('GaugeControllerRegistry', owner.address, owner.address, [owner.address], contracts.npm.address)
  })

  it('must correctly add a new pool', async () => {
    const k = key.toBytes32('prime')

    const pool = {
      name: 'Prime dApps',
      info: '',
      platformFee: 1000,
      staking: {
        token: helper.randomAddress(),
        lockupPeriodInBlocks: 10_000,
        ratio: 2000
      }
    }

    await registry.addOrEditPool(k, pool)

    const result = await registry.get(k)

    result.name.should.equal(pool.name)
    result.info.should.equal(pool.info)
    result.platformFee.should.equal(pool.platformFee)
    result.staking.token.should.equal(pool.staking.token)
    result.staking.lockupPeriodInBlocks.should.equal(pool.staking.lockupPeriodInBlocks)
    result.staking.ratio.should.equal(pool.staking.ratio)
  })
})
