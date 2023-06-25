const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Pause', () => {
  let contracts, pauserRole

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow NPM', 'veNPM')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    pauserRole = await contracts.registry.NS_ROLES_PAUSER()
    await contracts.registry.grantRole(pauserRole, bob.address)
  })

  it('must allow to be paused by pauser', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.registry.connect(bob).pause()

    const isPaused = await contracts.registry.paused()
    isPaused.should.equal(true)

    await contracts.registry.unpause()
  })

  it('must not allow to be paused by other than pauser', async () => {
    const [,, charlie] = await ethers.getSigners()

    await contracts.registry.connect(charlie).pause()
      .should.be.rejectedWith(`AccessControl: account ${charlie.address.toLowerCase()} is missing role ${pauserRole}`)
  })
})

describe('Gauge Controller Registry: Unpause', () => {
  let contracts, pauserRole, adminRole

  before(async () => {
    const [owner, bob, charlie] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow NPM', 'veNPM')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    pauserRole = await contracts.registry.NS_ROLES_PAUSER()
    adminRole = await contracts.registry.DEFAULT_ADMIN_ROLE()
    await contracts.registry.grantRole(pauserRole, bob.address)
    await contracts.registry.grantRole(adminRole, charlie.address)
  })

  it('must allow to be unpaused by owner', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.registry.connect(bob).pause()

    let isPaused = await contracts.registry.paused()
    isPaused.should.equal(true)

    await contracts.registry.unpause()
    isPaused = await contracts.registry.paused()
    isPaused.should.equal(false)
  })

  it('must allow to be unpaused by admin', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    await contracts.registry.connect(bob).pause()

    let isPaused = await contracts.registry.paused()
    isPaused.should.equal(true)

    await contracts.registry.connect(charlie).unpause()
    isPaused = await contracts.registry.paused()
    isPaused.should.equal(false)
  })

  it('must not allow to be unpaused by other than admin', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.registry.connect(bob).pause()

    await contracts.registry.connect(bob).unpause()
      .should.be.rejectedWith(`AccessControl: account ${bob.address.toLowerCase()} is missing role ${adminRole}`)

    await contracts.registry.unpause()
  })
})
