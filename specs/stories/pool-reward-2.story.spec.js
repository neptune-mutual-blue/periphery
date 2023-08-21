const factory = require('../util/factory')
const key = require('../util/key')
const helper = require('../util/helper')
const { mine, time } = require('@nomicfoundation/hardhat-network-helpers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400
const WEEKS = 7 * DAYS

describe('Liquidity Gauge Pool: Rewards Leftover Story', () => {
  let contracts, info, t0

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    info = {
      key: key.toBytes32('foobar'),
      name: 'Foobar',
      info: key.toBytes32(''),
      lockupPeriodInBlocks: 100,
      epochDuration: 10 * WEEKS,
      veBoostRatio: 1000,
      platformFee: helper.percentage(6.5),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.registry.address,
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
    await contracts.registry.addOrEditPools([contracts.gaugePool.address])

    const emission = helper.ether(10_000)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 10 * WEEKS, distribution)
    t0 = await time.latest()
  })

  it('At t0 + 1 week(s), bob deposits 500 staking tokens', async () => {
    const [, bob] = await ethers.getSigners()
    const amountToDeposit = helper.ether(500)

    await contracts.fakePod.mint(bob.address, amountToDeposit)
    await contracts.fakePod.connect(bob).approve(contracts.gaugePool.address, amountToDeposit)

    await time.setNextBlockTimestamp(t0 + 1 * WEEKS)
    await contracts.gaugePool.connect(bob).deposit(amountToDeposit)
  })

  it('At t0 + 2 week(s), charlie deposits 500 staking tokens', async () => {
    const [, , charlie] = await ethers.getSigners()
    const amountToDeposit = helper.ether(500)

    await contracts.fakePod.mint(charlie.address, amountToDeposit)
    await contracts.fakePod.connect(charlie).approve(contracts.gaugePool.address, amountToDeposit)

    await time.setNextBlockTimestamp(t0 + 2 * WEEKS)
    await contracts.gaugePool.connect(charlie).deposit(amountToDeposit)
  })

  it('At t0 + 5 week(s), charlie withdrawRewards', async () => {
    const [owner] = await ethers.getSigners()

    const emission = helper.ether(10_000)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)

    await time.setNextBlockTimestamp(t0 + 5 * WEEKS)
    await contracts.registry.setGauge(2, emission, 10 * WEEKS, distribution)
  })

  it('At t0 + 9 week(s), bob exits', async () => {
    const [, bob] = await ethers.getSigners()

    await mine(info.lockupPeriodInBlocks)
    const balanceBefore = await contracts.npm.balanceOf(bob.address)

    await time.setNextBlockTimestamp(t0 + 9 * WEEKS)
    const tx = await contracts.gaugePool.connect(bob).exit()
    const { events } = await tx.wait()

    const event = events.find(x => x.event === 'LiquidityGaugeRewardsWithdrawn')
    const balanceAfter = await contracts.npm.balanceOf(bob.address)
    const rewards = balanceAfter.toBigInt() - balanceBefore.toBigInt() + event.args.platformFee.toBigInt()

    // Total expected rewards for bob is 5,500 NPM
    rewards.should.be.lessThanOrEqual(5500_000000000000000000n)
    rewards.should.be.greaterThan(5499_000000000000000000n)
  })

  it('At t0 + 10 week(s), charlie exits', async () => {
    const [, , charlie] = await ethers.getSigners()

    await mine(info.lockupPeriodInBlocks)
    const balanceBefore = await contracts.npm.balanceOf(charlie.address)

    await time.setNextBlockTimestamp(t0 + 10 * WEEKS)
    const tx = await contracts.gaugePool.connect(charlie).exit()
    const { events } = await tx.wait()

    const event = events.find(x => x.event === 'LiquidityGaugeRewardsWithdrawn')
    const balanceAfter = await contracts.npm.balanceOf(charlie.address)
    const rewards = balanceAfter.toBigInt() - balanceBefore.toBigInt() + event.args.platformFee.toBigInt()

    // Total expected rewards for charlie is 6,000 NPM
    rewards.should.be.lessThanOrEqual(6000_000000000000000000n)
    rewards.should.be.greaterThan(5999_000000000000000000n)
  })
})
