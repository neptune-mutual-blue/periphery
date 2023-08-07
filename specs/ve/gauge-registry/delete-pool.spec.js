const factory = require('../../util/factory')
const helper = require('../../util/helper')
const pools = require('../../../scripts/ve/pools.baseGoerli.json')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Delete Pool', () => {
  let contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')

    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)
    contracts.pools = []
    contracts.poolInfo = []

    for (const pool of pools) {
      const fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')

      pool.stakingToken = fakePod.address
      pool.veToken = contracts.veToken.address
      pool.rewardToken = contracts.npm.address
      pool.registry = contracts.registry.address
      pool.treasury = helper.randomAddress()

      const deployed = await factory.deployUpgradeable('LiquidityGaugePool', owner.address, pool)

      pool.deployed = deployed
      pool.stakingTokenDeployed = fakePod

      contracts.pools.push(deployed.address)
      contracts.poolInfo.push(pool)
    }

    // Add pools
    await contracts.registry.addOrEditPools(contracts.pools)
  })

  it('must allow deleting pools', async () => {
    for (const pool of contracts.poolInfo) {
      const { key } = pool

      await contracts.registry.deactivatePool(key)
      await contracts.registry.deletePool(key)
      ; (await contracts.registry._pools(key)).should.equal(helper.zerox)
      ; (await contracts.registry._validPools(key)).should.equal(false)
      ; (await contracts.registry._activePools(key)).should.equal(false)
    }
  })

  it('must not allow deleting a pool when paused', async () => {
    const [, bob] = await ethers.getSigners()

    const pauserRole = await contracts.registry.NS_ROLES_PAUSER()
    await contracts.registry.grantRole(pauserRole, bob.address)

    await contracts.registry.connect(bob).pause()

    await contracts.registry.deletePool(helper.emptyBytes32)
      .should.be.rejectedWith('Pausable: paused')

    await contracts.registry.unpause()
  })
})
