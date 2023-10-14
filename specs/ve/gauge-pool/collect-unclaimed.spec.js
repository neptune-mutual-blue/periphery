const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Collect Unclaimed', () => {
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

  it('throws when accessed before epoch begins', async () => {
    await contracts.gaugePool.collectUnclaimed()
      .should.be.revertedWithCustomError(contracts.gaugePool, 'ZeroAmountError')
      .withArgs(key.toBytes32('unclaimed'))
  })

  it('allows to recover accidentally sent token before epoch begins', async () => {
    const [owner] = await ethers.getSigners()
    const amount = helper.ether(10)
    await contracts.npm.mint(contracts.gaugePool.address, amount)

    ;(await contracts.npm.balanceOf(owner.address)).should.equal(0)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(amount)

    await contracts.gaugePool.collectUnclaimed()

    ;(await contracts.npm.balanceOf(owner.address)).should.equal(amount)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(0)
  })

  it('allows to collect unclaimed tokens from previous epochs', async () => {
    const [owner, , registry] = await ethers.getSigners()
    const rewards = helper.ether(100)

    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(1, 1000, rewards)

    await mine(10, { interval: 1000 })

    await contracts.npm.mint(contracts.gaugePool.address, rewards)
    await contracts.gaugePool.connect(registry).setEpoch(2, 1000, rewards)

    await contracts.gaugePool.collectUnclaimed()

    ;(await contracts.npm.balanceOf(owner.address)).should.equal(rewards + helper.ether(10))
  })

  it('throws when not accessed by the owner', async () => {
    const [, bob] = await ethers.getSigners()
    const adminRole = await contracts.gaugePool.DEFAULT_ADMIN_ROLE()

    await contracts.gaugePool.connect(bob).collectUnclaimed()
      .should.be.rejectedWith(`AccessControl: account ${bob.address.toLowerCase()} is missing role ${adminRole}`)
  })
})

describe('Liquidity Gauge Pool: Collect Unclaimed (StakingToken == RewardToken)', () => {
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

  it('throws when accessed before epoch begins', async () => {
    await contracts.gaugePool.collectUnclaimed()
      .should.be.revertedWithCustomError(contracts.gaugePool, 'ZeroAmountError')
      .withArgs(key.toBytes32('unclaimed'))
  })

  it('allows to recover accidentally sent token before epoch begins', async () => {
    const [owner] = await ethers.getSigners()
    const amount = helper.ether(10)
    await contracts.npm.mint(contracts.gaugePool.address, amount)

    ;(await contracts.npm.balanceOf(owner.address)).should.equal(0)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(amount)

    await contracts.gaugePool.collectUnclaimed()

    ;(await contracts.npm.balanceOf(owner.address)).should.equal(amount)
    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(0)
  })

  it('allows to collect unclaimed tokens from previous epochs, while considering user deposits', async () => {
    const [owner, , registry] = await ethers.getSigners()
    const ownerBalanceOld = await contracts.npm.balanceOf(owner.address)

    const amountToDeposit = helper.ether(10)

    const rewards1 = helper.ether(100)
    await contracts.npm.mint(contracts.gaugePool.address, rewards1)
    await contracts.gaugePool.connect(registry).setEpoch(1, 1000, rewards1)

    await contracts.npm.mint(owner.address, amountToDeposit)
    await contracts.npm.approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.deposit(amountToDeposit)
    await mine(10, { interval: 1001 })

    const rewards2 = helper.ether(200)
    await contracts.npm.mint(contracts.gaugePool.address, rewards2)
    await contracts.gaugePool.connect(registry).setEpoch(2, 1000, rewards2)

    await contracts.gaugePool.collectUnclaimed()

    ;(await contracts.npm.balanceOf(contracts.gaugePool.address)).should.equal(rewards2 + amountToDeposit)
    ;(await contracts.npm.balanceOf(owner.address)).should.equal(rewards1 + ownerBalanceOld.toBigInt())
  })

  it('throws when not accessed by the owner', async () => {
    const [, bob] = await ethers.getSigners()
    const adminRole = await contracts.gaugePool.DEFAULT_ADMIN_ROLE()

    await contracts.gaugePool.connect(bob).collectUnclaimed()
      .should.be.rejectedWith(`AccessControl: account ${bob.address.toLowerCase()} is missing role ${adminRole}`)
  })
})
