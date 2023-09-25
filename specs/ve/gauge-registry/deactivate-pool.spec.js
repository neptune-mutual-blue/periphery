const factory = require('../../util/factory')
const helper = require('../../util/helper')
const key = require('../../util/key')
const pools = require('../../../scripts/ve/pools.baseGoerli.json')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Deactivate Pool', () => {
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

      const info = {
        key: pool.key,
        stakingToken: fakePod.address,
        veToken: contracts.veToken.address,
        rewardToken: contracts.npm.address,
        registry: contracts.registry.address,
        poolInfo: {
          name: pool.name,
          info: key.toBytes32('info'),
          epochDuration: pool.epochDuration,
          veBoostRatio: pool.veBoostRatio,
          platformFee: pool.platformFee,
          treasury: helper.randomAddress()
        }
      }

      const deployed = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])

      pool.deployed = deployed
      pool.stakingTokenDeployed = fakePod

      contracts.pools.push(deployed.address)
      contracts.poolInfo.push(pool)
    }

    // Add pools
    await contracts.registry.addOrEditPools(contracts.pools)
  })

  it('must allow deactivating pools', async () => {
    for (const pool of contracts.poolInfo) {
      const { key, deployed } = pool

      await contracts.registry.deactivatePool(key)
      ; (await contracts.registry._pools(key)).should.equal(deployed.address)
      ; (await contracts.registry._validPools(key)).should.equal(true)
      ; (await contracts.registry._activePools(key)).should.equal(false)
    }
  })

  it('must not allow deactivating a pool twice', async () => {
    for (const pool of contracts.poolInfo) {
      const { key } = pool

      await contracts.registry.deactivatePool(key)
        .should.be.revertedWithCustomError(contracts.registry, 'PoolAlreadyDeactivatedError')
        .withArgs(key)
    }
  })

  it('must not allow deactivating a non-existent pool', async () => {
    await contracts.registry.activatePool(helper.emptyBytes32)
      .should.be.revertedWithCustomError(contracts.registry, 'PoolNotFoundError')
      .withArgs(helper.emptyBytes32)
  })

  it('must not allow deactivating a pool when paused', async () => {
    const [, bob] = await ethers.getSigners()

    const pauserRole = await contracts.registry._NS_ROLES_PAUSER()
    await contracts.registry.grantRole(pauserRole, bob.address)

    await contracts.registry.connect(bob).pause()

    await contracts.registry.deactivatePool(helper.emptyBytes32)
      .should.be.rejectedWith('Pausable: paused')

    await contracts.registry.unpause()
  })
})
