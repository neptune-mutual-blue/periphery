const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: setPool', () => {
  let contracts, info1, info2

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.fakeRegistry = owner

    info1 = {
      key: key.toBytes32('foobar'),
      name: 'Foobar',
      info: key.toBytes32(''),
      lockupPeriodInBlocks: 100,
      epochDuration: 28 * DAYS,
      veBoostRatio: 1000,
      platformFee: helper.percentage(6.5),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.fakeRegistry.address,
      treasury: helper.randomAddress()
    }

    info2 = {
      key: key.toBytes32('foobar2'),
      name: 'Foobar2',
      info: key.toBytes32(''),
      lockupPeriodInBlocks: 200,
      epochDuration: 14 * DAYS,
      veBoostRatio: 500,
      platformFee: helper.percentage(3.5),
      stakingToken: helper.randomAddress(),
      veToken: helper.randomAddress(),
      rewardToken: helper.randomAddress(),
      registry: helper.randomAddress(),
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info1, owner.address, [])
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ;(await contracts.gaugePool._epoch()).should.equal(0)
    ;(await contracts.gaugePool.getKey()).should.equal(info1.key)
    ;(await contracts.gaugePool.hasRole(helper.emptyBytes32, owner.address)).should.equal(true)

    // Before
    let _info = await contracts.gaugePool._poolInfo()

    _info.key.should.equal(info1.key)
    _info.name.should.equal(info1.name)
    _info.info.should.equal(info1.info)
    _info.lockupPeriodInBlocks.should.equal(info1.lockupPeriodInBlocks)
    _info.epochDuration.should.equal(info1.epochDuration)
    _info.veBoostRatio.should.equal(info1.veBoostRatio)
    _info.platformFee.should.equal(info1.platformFee)
    _info.stakingToken.should.equal(contracts.fakePod.address)
    _info.veToken.should.equal(contracts.veToken.address)
    _info.rewardToken.should.equal(contracts.npm.address)
    _info.registry.should.equal(contracts.fakeRegistry.address)
    _info.treasury.should.equal(info1.treasury)

    await contracts.gaugePool.setPool(info2)

    // After
    _info = await contracts.gaugePool._poolInfo()

    _info.key.should.equal(info2.key)
    _info.name.should.equal(info2.name)
    _info.info.should.equal(info2.info)
    _info.lockupPeriodInBlocks.should.equal(info2.lockupPeriodInBlocks)
    _info.epochDuration.should.equal(info2.epochDuration)
    _info.veBoostRatio.should.equal(info2.veBoostRatio)
    _info.platformFee.should.equal(info2.platformFee)
    _info.stakingToken.should.equal(info2.stakingToken)
    _info.veToken.should.equal(info2.veToken)
    _info.rewardToken.should.equal(info2.rewardToken)
    _info.registry.should.equal(info2.registry)
    _info.treasury.should.equal(info2.treasury)
  })
})
