const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Withdraw', () => {
  let contracts, info

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow NPM', 'veNPM')
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
      veToken: contracts.veNpm.address,
      rewardToken: contracts.npm.address,
      registry: contracts.registry.address,
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', owner.address, info)
    await contracts.registry.addOrEditPools([contracts.gaugePool.address])

    const emission = helper.ether(100_00)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 28 * DAYS, distribution)
  })

  it('must allow withdrawing staking tokens', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)

    const balanceBeforeDeposit = await contracts.fakePod.balanceOf(owner.address)
    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(info.lockupPeriodInBlocks)

    await contracts.gaugePool.withdraw(amountToDeposit)
    const balanceAfterWithdraw = await contracts.fakePod.balanceOf(owner.address)
    balanceAfterWithdraw.should.equal(balanceBeforeDeposit)
  })

  it('must not allow withdrawing before lockup period ends', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)

    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(info.lockupPeriodInBlocks / 2)

    await contracts.gaugePool.withdraw(amountToDeposit)
      .should.be.rejectedWith('WithdrawalLockedError')

    await mine(info.lockupPeriodInBlocks / 2)
    await contracts.gaugePool.withdraw(amountToDeposit)
  })

  it('must not allow withdrawing 0 staking tokens', async () => {
    await contracts.gaugePool.withdraw(0)
      .should.be.rejectedWith('ZeroAmountError')
  })

  it('must not allow withdrawing when paused', async () => {
    const [, bob] = await ethers.getSigners()

    const pauserRole = await contracts.gaugePool.NS_ROLES_PAUSER()
    await contracts.gaugePool.grantRole(pauserRole, bob.address)

    await contracts.gaugePool.connect(bob).pause()
    await contracts.gaugePool.withdraw(0)
      .should.be.rejectedWith('Pausable: paused')

    await contracts.gaugePool.unpause()
  })

  it('must not allow withdrawing staking tokens when amount locked is 0', async () => {
    const [owner] = await ethers.getSigners()

    const locked = await contracts.gaugePool._lockedByMe(owner.address)
    locked.should.equal(0)
    const amountToDeposit = helper.ether(10)
    await contracts.gaugePool.withdraw(amountToDeposit)
      .should.be.rejected
  })
})
