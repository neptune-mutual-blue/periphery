const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Collect Dust', () => {
  let contracts, info

  before(async () => {
    const [owner, , registry] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')

    info = {
      key: key.toBytes32('foobar'),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: registry.address,
      poolInfo: {
        name: 'Foobar',
        info: key.toBytes32('info'),
        epochDuration: 28 * DAYS,
        veBoostRatio: 1000,
        platformFee: helper.percentage(6.5),
        treasury: helper.randomAddress()
      }
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
  })

  it('allows to recover accidentally sent token before epoch begins', async () => {
    const [owner,, registry] = await ethers.getSigners()
    const amount = helper.ether(10)
    const rewards = helper.ether(100)

    await contracts.npm.mint(contracts.gaugePool.address, amount)
    await contracts.npm.mint(contracts.gaugePool.address, rewards)

    ;(await contracts.npm.balanceOf(owner.address)).should.equal(0)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(amount + rewards)

    await contracts.gaugePool.connect(registry).setEpoch(1, 1000, rewards)

    ;(await contracts.npm.balanceOf(registry.address)).should.equal(amount)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(rewards)
  })

  it('allows to collect unclaimed tokens from previous epochs', async () => {
    const [, , registry] = await ethers.getSigners()
    const rewards = helper.ether(100)

    await mine(10, { interval: 1000 }) // ends epoch #1 without deposits

    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(2, 1000, rewards)

    ;(await contracts.npm.balanceOf(registry.address)).should.equal(rewards + helper.ether(10))
  })

  it('allows to collect unclaimed tokens from previous epochs', async () => {
    const [, , registry, a, b, c, d] = await ethers.getSigners()
    const rewards = helper.ether(100)
    const amountToDeposit = helper.ether(15)

    await mine(10, { interval: 1000 }) // ends epoch #2

    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(3, 1000, rewards) // starts epoch #3

    // burn all reward tokens of registry
    await contracts.npm.connect(registry).transfer(helper.zero1, await contracts.npm.balanceOf(registry.address))
    ;(await contracts.npm.balanceOf(registry.address)).should.equal(0)

    // 4 wallets deposit same amount of tokens at epoch start
    await contracts.fakePod.mint(a.address, amountToDeposit)
    await contracts.fakePod.connect(a).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(a).deposit(amountToDeposit)

    await contracts.fakePod.mint(b.address, amountToDeposit)
    await contracts.fakePod.connect(b).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(b).deposit(amountToDeposit)

    await contracts.fakePod.mint(c.address, amountToDeposit)
    await contracts.fakePod.connect(c).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(c).deposit(amountToDeposit)

    await contracts.fakePod.mint(d.address, amountToDeposit)
    await contracts.fakePod.connect(d).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(d).deposit(amountToDeposit)

    await mine(10, { interval: 997 })

    // 3 wallets interact again at epoch end
    await contracts.fakePod.mint(a.address, amountToDeposit)
    await contracts.fakePod.connect(a).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(a).deposit(amountToDeposit)

    await contracts.fakePod.mint(b.address, amountToDeposit)
    await contracts.fakePod.connect(b).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(b).deposit(amountToDeposit)

    await contracts.fakePod.mint(c.address, amountToDeposit)
    await contracts.fakePod.connect(c).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(c).deposit(amountToDeposit)

    // starts epoch #4
    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(4, 1000, rewards)

    // Approximately 25% of rewards are collected as rewards
    ;(await contracts.npm.balanceOf(registry.address)).should.be.greaterThan(rewards * 25n / 100n)
    ;(await contracts.npm.balanceOf(registry.address)).should.be.lessThan(rewards * 26n / 100n)
  })
})

describe('Liquidity Gauge Pool: Collect Dust (StakingToken == RewardToken)', () => {
  let contracts, info

  before(async () => {
    const [owner, , registry] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')

    info = {
      key: key.toBytes32('foobar'),
      stakingToken: contracts.npm.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: registry.address,
      poolInfo: {
        name: 'Foobar',
        info: key.toBytes32('info'),
        epochDuration: 28 * DAYS,
        veBoostRatio: 1000,
        platformFee: helper.percentage(6.5),
        treasury: helper.randomAddress()
      }
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
  })

  it('allows to recover accidentally sent token before epoch begins', async () => {
    const [owner,, registry] = await ethers.getSigners()
    const amount = helper.ether(10)
    const rewards = helper.ether(100)

    await contracts.npm.mint(contracts.gaugePool.address, amount)
    await contracts.npm.mint(contracts.gaugePool.address, rewards)

    ;(await contracts.npm.balanceOf(owner.address)).should.equal(0)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(amount + rewards)

    await contracts.gaugePool.connect(registry).setEpoch(1, 1000, rewards)

    ;(await contracts.npm.balanceOf(registry.address)).should.equal(amount)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(rewards)
  })

  it('allows to collect unclaimed tokens from previous epochs', async () => {
    const [, , registry] = await ethers.getSigners()
    const rewards = helper.ether(100)

    await mine(10, { interval: 1000 }) // ends epoch #1 without deposits

    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(2, 1000, rewards)

    ;(await contracts.npm.balanceOf(registry.address)).should.equal(rewards + helper.ether(10))
  })

  it('allows to collect unclaimed tokens from previous epochs', async () => {
    const [, , registry, a, b, c, d] = await ethers.getSigners()
    const rewards = helper.ether(100)
    const amountToDeposit = helper.ether(15)

    await mine(10, { interval: 1000 }) // ends epoch #2

    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(3, 1000, rewards) // starts epoch #3

    // burn all reward tokens of registry
    await contracts.npm.connect(registry).transfer(helper.zero1, await contracts.npm.balanceOf(registry.address))
    ;(await contracts.npm.balanceOf(registry.address)).should.equal(0)

    // 4 wallets deposit same amount of tokens at epoch start
    await contracts.npm.mint(a.address, amountToDeposit)
    await contracts.npm.connect(a).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(a).deposit(amountToDeposit)

    await contracts.npm.mint(b.address, amountToDeposit)
    await contracts.npm.connect(b).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(b).deposit(amountToDeposit)

    await contracts.npm.mint(c.address, amountToDeposit)
    await contracts.npm.connect(c).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(c).deposit(amountToDeposit)

    await contracts.npm.mint(d.address, amountToDeposit)
    await contracts.npm.connect(d).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(d).deposit(amountToDeposit)

    await mine(10, { interval: 997 })

    // 3 wallets interact again at epoch end
    await contracts.npm.mint(a.address, amountToDeposit)
    await contracts.npm.connect(a).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(a).deposit(amountToDeposit)

    await contracts.npm.mint(b.address, amountToDeposit)
    await contracts.npm.connect(b).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(b).deposit(amountToDeposit)

    await contracts.npm.mint(c.address, amountToDeposit)
    await contracts.npm.connect(c).approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.connect(c).deposit(amountToDeposit)

    // starts epoch #4
    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(4, 1000, rewards)

    // Approximately 25% of rewards are collected as rewards
    ;(await contracts.npm.balanceOf(registry.address)).should.be.greaterThan(rewards * 25n / 100n)
    ;(await contracts.npm.balanceOf(registry.address)).should.be.lessThan(rewards * 26n / 100n)
  })
})
