const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Grant Roles', () => {
  let contracts, info, pauserRole, recoveryAgentRole

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
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
        info: key.toBytes32('info'),
        epochDuration: 28 * DAYS,
        veBoostRatio: 1000,
        platformFee: helper.percentage(6.5),
        treasury: helper.randomAddress()
      }
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])

    pauserRole = await contracts.gaugePool._NS_ROLES_PAUSER()
    recoveryAgentRole = await contracts.gaugePool._NS_ROLES_RECOVERY_AGENT()
    await contracts.gaugePool.grantRole(pauserRole, bob.address)
  })

  it('must revert if no detail is provided.', async () => {
    await contracts.gaugePool.grantRoles([])
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
  })

  it('must allow to grant multiple roles.', async () => {
    const [, , charlie] = await ethers.getSigners()

    await contracts.gaugePool.grantRoles([
      {
        account: charlie.address,
        roles: [
          pauserRole,
          recoveryAgentRole
        ]
      }
    ])

    await contracts.gaugePool.revokeRole(pauserRole, charlie.address)
    await contracts.gaugePool.revokeRole(recoveryAgentRole, charlie.address)
  })

  it('must not allow to grant roles when paused', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    await contracts.gaugePool.connect(bob).pause()

    await contracts.gaugePool.grantRoles([
      {
        account: charlie.address,
        roles: [
          pauserRole,
          recoveryAgentRole
        ]
      }
    ]).should.be.rejectedWith('Pausable: paused')

    await contracts.gaugePool.unpause()
  })
})
