const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Deposit', () => {
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
  })

  it('must not allow depositing before setting the gauge', async () => {
    const amountToDeposit = helper.ether(10)

    await contracts.gaugePool.deposit(amountToDeposit)
      .should.be.revertedWithCustomError(contracts.gaugePool, 'EpochUnavailableError')
  })

  it('must allow depositing staking tokens', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    const emission = helper.ether(100_00)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 28 * DAYS, distribution)

    await contracts.fakePod.mint(owner.address, amountToDeposit)
    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)

    await contracts.gaugePool.deposit(amountToDeposit)
  })

  it('must not allow depositing when paused', async () => {
    const [owner, bob] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    const pauserRole = await contracts.gaugePool._NS_ROLES_PAUSER()
    await contracts.gaugePool.grantRole(pauserRole, bob.address)

    await contracts.fakePod.mint(owner.address, amountToDeposit)

    await contracts.fakePod.approve(contracts.gaugePool.address, amountToDeposit)

    await contracts.gaugePool.connect(bob).pause()
    await contracts.gaugePool.deposit(amountToDeposit)
      .should.be.rejectedWith('Pausable: paused')

    await contracts.gaugePool.unpause()
  })

  it('must not allow depositing 0 tokens', async () => {
    const amountToDeposit = 0

    await contracts.gaugePool.deposit(amountToDeposit)
      .should.be.revertedWithCustomError(contracts.gaugePool, 'ZeroAmountError')
      .withArgs(key.toBytes32('amount'))
  })

  it('throws during reentrancy attack', async () => {
    const [owner] = await ethers.getSigners()
    const amountToDeposit = helper.ether(10)

    contracts.npm = await factory.deployUpgradeable('FakeTokenWithReentrancy', contracts.gaugePool.address, key.toBytes32('deposit'))
    contracts.npm.mint(owner.address, amountToDeposit)
    contracts.npm.approve(contracts.gaugePool.address, amountToDeposit)

    await contracts.gaugePool.setPool({
      ...info,
      stakingToken: contracts.npm.address
    })

    await contracts.gaugePool.deposit(amountToDeposit)
      .should.be.rejectedWith('ReentrancyGuard: reentrant call')
  })
})
