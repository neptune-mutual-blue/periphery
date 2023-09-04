const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Withdraw Rewards', () => {
  let contracts, info

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    info = {
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
      registry: contracts.registry.address,
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
    await contracts.registry.addOrEditPools([contracts.gaugePool.address])

    const emission = helper.ether(100_00)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 28 * DAYS, distribution)
  })

  it('must allow withdrawing rewards', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(info.lockupPeriodInBlocks / 2)

    const balanceBeforeWithdraw = await contracts.npm.balanceOf(owner.address)

    const pendingRewards = await contracts.gaugePool.calculateReward(owner.address)
    await contracts.gaugePool.withdrawRewards()

    const balanceAfterWithdraw = await contracts.npm.balanceOf(owner.address)
    pendingRewards.should.be.greaterThan(0)

    const fees = BigInt(pendingRewards.toString()) * BigInt(650) / BigInt(10000)
    balanceAfterWithdraw.should.be.greaterThan(
      BigInt(balanceBeforeWithdraw.toString()) + BigInt(pendingRewards.toString()) - fees
    )
  })

  it('must not allow withdrawing rewards when paused', async () => {
    const [owner, bob] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    const pauserRole = await contracts.gaugePool._NS_ROLES_PAUSER()
    await contracts.gaugePool.grantRole(pauserRole, bob.address)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(info.lockupPeriodInBlocks / 2)

    await contracts.gaugePool.connect(bob).pause()
    await contracts.gaugePool.withdrawRewards()
      .should.be.rejectedWith('Pausable: paused')

    await contracts.gaugePool.unpause()
    await contracts.gaugePool.withdrawRewards()
  })

  it('must allow withdrawing rewards after exit', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(info.lockupPeriodInBlocks)

    await contracts.gaugePool.exit()

    const pendingRewards = await contracts.gaugePool.calculateReward(owner.address)
    pendingRewards.should.be.equal(0)

    await contracts.gaugePool.withdrawRewards()
  })

  it('throws when platform fee is too high', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)
    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(info.lockupPeriodInBlocks / 2)

    await contracts.gaugePool.setPool({
      ...info,
      platformFee: 100_000
    })

    await contracts.gaugePool.withdrawRewards()
      .should.be.revertedWithCustomError(contracts.gaugePool, 'PlatformFeeTooHighError')
      .withArgs(100_000)
  })

  it('throws during reentrancy attack', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    const gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
    contracts.npm = await factory.deployUpgradeable('FakeTokenWithReentrancy', gaugePool.address, key.toBytes32('withdrawRewards'))

    await gaugePool.setPool({ ...info, rewardToken: contracts.npm.address, registry: owner.address })

    await contracts.npm.mint(gaugePool.address, helper.ether(100_00))
    await gaugePool.setEpoch(1, 1 * DAYS, helper.ether(100_00))

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(gaugePool.address, amountToDeposit)

    await gaugePool.deposit(amountToDeposit)

    await mine(info.lockupPeriodInBlocks)

    await gaugePool.withdrawRewards()
      .should.be.rejectedWith('ReentrancyGuard: reentrant call')
  })
})
