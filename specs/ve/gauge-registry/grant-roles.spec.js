const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Grant Roles', () => {
  let contracts, pauserRole, recoveryAgentRole

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    pauserRole = await contracts.registry.NS_ROLES_PAUSER()
    recoveryAgentRole = await contracts.registry.NS_ROLES_RECOVERY_AGENT()
    await contracts.registry.grantRole(pauserRole, bob.address)
  })

  it('must revert if no detail is provided.', async () => {
    await contracts.registry.grantRoles([])
      .should.be.revertedWithCustomError(contracts.registry, 'InvalidArgumentError')
  })

  it('must allow to grant multiple roles.', async () => {
    const [, , charlie] = await ethers.getSigners()

    await contracts.registry.grantRoles([
      {
        account: charlie.address,
        roles: [
          pauserRole,
          recoveryAgentRole
        ]
      }
    ])

    await contracts.registry.revokeRole(pauserRole, charlie.address)
    await contracts.registry.revokeRole(recoveryAgentRole, charlie.address)
  })

  it('must not allow to grant roles when paused', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    await contracts.registry.connect(bob).pause()

    await contracts.registry.grantRoles([
      {
        account: charlie.address,
        roles: [
          pauserRole,
          recoveryAgentRole
        ]
      }
    ]).should.be.rejectedWith('Pausable: paused')

    await contracts.registry.unpause()
  })
})
