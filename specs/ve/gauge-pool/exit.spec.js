const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Exit', () => {
  let contracts, info, lockupPeriodInBlocks

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    info = {
      key: key.toBytes32('foobar'),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.registry.address,
      poolInfo: {
        name: 'Foobar',
        info: key.toBytes32(''),
        epochDuration: 28 * DAYS,
        veBoostRatio: 1000,
        platformFee: helper.percentage(6.5),
        treasury: helper.randomAddress()
      }
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
    lockupPeriodInBlocks = await contracts.gaugePool._LOCKUP_PERIOD_IN_BLOCKS()
    await contracts.registry.addOrEditPools([contracts.gaugePool.address])

    const emission = helper.ether(100_00)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 28 * DAYS, distribution)
  })

  it('must allow to exit', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)

    const balanceBeforeDeposit = await contracts.fakePod.balanceOf(owner.address)
    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(lockupPeriodInBlocks)

    await contracts.gaugePool.exit()
    const balanceAfterExit = await contracts.fakePod.balanceOf(owner.address)
    balanceAfterExit.should.equal(balanceBeforeDeposit)
  })

  it('must not allow to exit before lockup period ends', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)

    await contracts.gaugePool.deposit(amountToDeposit)

    await mine(lockupPeriodInBlocks / 2)

    await contracts.gaugePool.exit()
      .should.be.rejectedWith('WithdrawalLockedError')
  })

  it('must not allow to exit when paused', async () => {
    const [, bob] = await ethers.getSigners()

    const pauserRole = await contracts.gaugePool._NS_ROLES_PAUSER()
    await contracts.gaugePool.grantRole(pauserRole, bob.address)
    await contracts.gaugePool.connect(bob).pause()

    await contracts.gaugePool.exit()
      .should.be.rejectedWith('Pausable: paused')

    await contracts.gaugePool.unpause()
  })

  it('throws during reentrancy attack', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    const npmToken = await factory.deployUpgradeable('FakeTokenWithReentrancy', key.toBytes32('exit'))
    const gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', { ...info, rewardToken: npmToken.address, registry: owner.address }, owner.address, [])

    npmToken.setPool(gaugePool.address)
    npmToken.setTarget(key.toBytes32(''))

    await npmToken.mint(gaugePool.address, helper.ether(100_00))
    await gaugePool.setEpoch(1, 1 * DAYS, helper.ether(100_00))

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(gaugePool.address, amountToDeposit)

    await gaugePool.deposit(amountToDeposit)

    await mine(lockupPeriodInBlocks)

    npmToken.setTarget(key.toBytes32('exit'))
    await gaugePool.exit()
      .should.be.rejectedWith('ReentrancyGuard: reentrant call')
  })
})
