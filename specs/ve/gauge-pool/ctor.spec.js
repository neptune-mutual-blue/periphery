const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Constructor', () => {
  let contracts, info

  before(async () => {
    const [owner, pauser1, pauser2] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.fakeRegistry = owner

    info = {
      key: key.toBytes32('foobar'),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.fakeRegistry.address,
      poolInfo: {
        name: 'Foobar',
        info: key.toBytes32(''),
        epochDuration: 28 * DAYS,
        veBoostRatio: 1000,
        platformFee: helper.percentage(6.5),
        treasury: helper.randomAddress()
      }
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [pauser1.address, pauser2.address])
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ;(await contracts.gaugePool._epoch()).should.equal(0)
    ;(await contracts.gaugePool._key()).should.equal(info.key)
    ;(await contracts.gaugePool._stakingToken()).should.equal(info.stakingToken)
    ;(await contracts.gaugePool._veToken()).should.equal(info.veToken)
    ;(await contracts.gaugePool._rewardToken()).should.equal(info.rewardToken)
    ;(await contracts.gaugePool._registry()).should.equal(info.registry)

    ;(await contracts.gaugePool.hasRole(helper.emptyBytes32, owner.address)).should.equal(true)
    ;(await contracts.gaugePool.getKey()).should.equal(info.key)

    const _poolInfo = await contracts.gaugePool._poolInfo()

    _poolInfo.name.should.equal(info.poolInfo.name)
    _poolInfo.info.should.equal(info.poolInfo.info)
    _poolInfo.epochDuration.should.equal(28 * DAYS)
    _poolInfo.veBoostRatio.should.equal(1000)
    _poolInfo.platformFee.should.equal(info.poolInfo.platformFee)
    _poolInfo.treasury.should.equal(info.poolInfo.treasury)
  })

  it('must not allow to be initialized twice', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.gaugePool.initialize(info, owner.address, [])
      .should.be.rejectedWith('Initializable: contract is already initialized')
  })

  it('throws if pauser is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [helper.zerox])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('pausers'))
  })

  it('throws if admin is invalid', async () => {
    await factory.deployUpgradeable('LiquidityGaugePool', info, helper.zerox, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('admin'))
  })

  it('throws if args.key is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, key: helper.emptyBytes32 }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.key'))
  })

  it('throws if args.name is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, poolInfo: { ...info.poolInfo, name: '' } }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.name'))
  })

  it('throws if args.info is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, poolInfo: { ...info.poolInfo, info: '' } }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.info'))
  })

  it('throws if args.epochDuration is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, poolInfo: { ...info.poolInfo, epochDuration: 0 } }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.epochDuration'))
  })

  it('throws if args.veBoostRatio is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, poolInfo: { ...info.poolInfo, veBoostRatio: 0 } }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.veBoostRatio'))
  })

  it('must allow if args.platformFee is zero', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, poolInfo: { ...info.poolInfo, platformFee: 0 } }, owner.address, [])
  })

  it('throws if args.platformFee exceeds maximum limit', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, poolInfo: { ...info.poolInfo, platformFee: '2001' } }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.platformFee'))
  })

  it('throws if args.stakingToken is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, stakingToken: helper.zerox }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.stakingToken'))
  })

  it('throws if args.veToken is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, veToken: helper.zerox }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.veToken'))
  })

  it('throws if args.rewardToken is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, rewardToken: helper.zerox }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.rewardToken'))
  })

  it('throws if args.registry is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, registry: helper.zerox }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.registry'))
  })

  it('throws if args.treasury is invalid', async () => {
    const [owner] = await ethers.getSigners()

    await factory.deployUpgradeable('LiquidityGaugePool', { ...info, poolInfo: { ...info.poolInfo, treasury: helper.zerox } }, owner.address, [])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('args.treasury'))
  })
})
