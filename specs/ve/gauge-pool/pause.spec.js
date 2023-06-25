const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Pause', () => {
  let contracts, info, pauserRole

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
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

    pauserRole = await contracts.gaugePool.NS_ROLES_PAUSER()
    await contracts.gaugePool.grantRole(pauserRole, bob.address)
  })

  it('must allow to be paused by pauser', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.gaugePool.connect(bob).pause()

    const isPaused = await contracts.gaugePool.paused()
    isPaused.should.equal(true)

    await contracts.gaugePool.unpause()
  })

  it('must not allow to be paused by other than pauser', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.gaugePool.pause()
      .should.be.rejectedWith(`AccessControl: account ${owner.address.toLowerCase()} is missing role ${pauserRole}`)
  })
})

describe('Liquidity Gauge Pool: Unpause', () => {
  let contracts, info, pauserRole, adminRole

  before(async () => {
    const [owner, bob, charlie] = await ethers.getSigners()
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

    pauserRole = await contracts.gaugePool.NS_ROLES_PAUSER()
    adminRole = await contracts.gaugePool.DEFAULT_ADMIN_ROLE()
    await contracts.gaugePool.grantRole(pauserRole, bob.address)
    await contracts.gaugePool.grantRole(adminRole, charlie.address)
  })

  it('must allow to be unpaused by owner', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.gaugePool.connect(bob).pause()

    let isPaused = await contracts.gaugePool.paused()
    isPaused.should.equal(true)

    await contracts.gaugePool.unpause()
    isPaused = await contracts.gaugePool.paused()
    isPaused.should.equal(false)
  })

  it('must allow to be unpaused by admin', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    await contracts.gaugePool.connect(bob).pause()

    let isPaused = await contracts.gaugePool.paused()
    isPaused.should.equal(true)

    await contracts.gaugePool.connect(charlie).unpause()
    isPaused = await contracts.gaugePool.paused()
    isPaused.should.equal(false)
  })

  it('must not allow to be unpaused by other than admin', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.gaugePool.connect(bob).pause()

    await contracts.gaugePool.connect(bob).unpause()
      .should.be.rejectedWith(`AccessControl: account ${bob.address.toLowerCase()} is missing role ${adminRole}`)

    await contracts.gaugePool.unpause()
  })
})
