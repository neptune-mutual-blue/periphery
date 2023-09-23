const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Set Pool', () => {
  let contracts, info, poolInfo1, poolInfo2

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    poolInfo1 = {
      name: 'Foobar',
      info: 'info1',
      epochDuration: 28 * DAYS,
      veBoostRatio: 1000,
      platformFee: helper.percentage(6.5),
      treasury: helper.randomAddress()
    }

    info = {
      key: key.toBytes32('foobar'),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.registry.address,
      poolInfo: { ...poolInfo1 }
    }

    poolInfo2 = {
      name: 'Foobar2',
      info: 'info2',
      epochDuration: 14 * DAYS,
      veBoostRatio: 500,
      platformFee: helper.percentage(3.5),
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
  })

  it('must correctly set the pool info', async () => {
    const [owner] = await ethers.getSigners()

    ;(await contracts.gaugePool._epoch()).should.equal(0)
    ;(await contracts.gaugePool.getKey()).should.equal(info.key)
    ;(await contracts.gaugePool.hasRole(helper.emptyBytes32, owner.address)).should.equal(true)

    // Before
    let _poolInfo = await contracts.gaugePool._poolInfo()

    _poolInfo.name.should.equal(poolInfo1.name)
    _poolInfo.info.should.equal(poolInfo1.info)
    _poolInfo.epochDuration.should.equal(poolInfo1.epochDuration)
    _poolInfo.veBoostRatio.should.equal(poolInfo1.veBoostRatio)
    _poolInfo.platformFee.should.equal(poolInfo1.platformFee)
    _poolInfo.treasury.should.equal(poolInfo1.treasury)

    await contracts.gaugePool.setPool(poolInfo2)

    // After
    _poolInfo = await contracts.gaugePool._poolInfo()

    _poolInfo.name.should.equal(poolInfo2.name)
    _poolInfo.info.should.equal(poolInfo2.info)
    _poolInfo.epochDuration.should.equal(poolInfo2.epochDuration)
    _poolInfo.veBoostRatio.should.equal(poolInfo2.veBoostRatio)
    _poolInfo.platformFee.should.equal(poolInfo2.platformFee)
    _poolInfo.treasury.should.equal(poolInfo2.treasury)
  })

  it('throws when not accessed by admin', async () => {
    const [, bob] = await ethers.getSigners()
    const adminRole = await contracts.gaugePool.DEFAULT_ADMIN_ROLE()

    await contracts.gaugePool.connect(bob).setPool(poolInfo2)
      .should.be.rejectedWith(`AccessControl: account ${bob.address.toLowerCase()} is missing role ${adminRole}`)
  })

  it('throws if platformFee exceeds maximum limit', async () => {
    await contracts.gaugePool.setPool({ ...poolInfo2, platformFee: '2001' }) // 20.01%
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.platformFee'))
  })

  it('throws if epoch is started', async () => {
    const [owner] = await ethers.getSigners()
    const key = await contracts.gaugePool.getKey()
    const emission = helper.ether(100_00)
    const distribution = [{ key, emission }]

    await contracts.registry.addOrEditPools([contracts.gaugePool.address])
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 28 * DAYS, distribution)

    await contracts.gaugePool.setPool(poolInfo1)
      .should.be.revertedWithCustomError(contracts.gaugePool, 'EpochUnavailableError')
  })
})
