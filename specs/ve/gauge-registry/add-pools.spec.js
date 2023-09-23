const factory = require('../../util/factory')
const helper = require('../../util/helper')
const pools = require('../../../scripts/ve/pools.baseGoerli.json')
const key = require('../../util/key')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Gauge Controller Registry: Add or Edit Pool', () => {
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
  })

  it('must correctly add new pools', async () => {
    await contracts.registry.addOrEditPools(contracts.pools)

    for (const pool of contracts.poolInfo) {
      const { key, deployed } = pool

      ; (await contracts.registry._pools(key)).should.equal(deployed.address)
      ; (await contracts.registry._validPools(key)).should.equal(true)
      ; (await contracts.registry._activePools(key)).should.equal(true)
    }
  })

  it('must allow setting the gauges', async () => {
    const [owner] = await ethers.getSigners()
    let total = 0
    const distribution = []

    for (const pool of contracts.poolInfo) {
      const { key } = pool
      const emission = helper.getRandomNumber(100_000, 300_000)
      total += emission

      distribution.push({ key, emission: helper.ether(emission) })
    }

    await contracts.npm.mint(owner.address, helper.ether(total))
    await contracts.npm.approve(contracts.registry.address, helper.ether(total))
    await contracts.registry.setGauge(1, helper.ether(total), 28 * DAYS, distribution)

    for (const pool of contracts.poolInfo) {
      ;(await pool.deployed._epoch()).should.equal(1)
    }
  })

  it('must not allow adding same pool twice', async () => {
    await contracts.registry.addOrEditPools(contracts.pools)
      .should.be.revertedWithCustomError(contracts.registry, 'PoolAlreadyExistsError')
  })

  it('must not allow invalid arguments', async () => {
    await contracts.registry.addOrEditPools([])
      .should.be.revertedWithCustomError(contracts.registry, 'InvalidArgumentError')
      .withArgs(key.toBytes32('pools'))
  })

  it('must allow adding deleted pools', async () => {
    for (const pool of contracts.poolInfo) {
      const { key } = pool
      await contracts.registry.deactivatePool(key)
      await contracts.registry.deletePool(key)
    }

    await contracts.registry.addOrEditPools(contracts.pools)
  })

  it('must allow editing pools', async () => {
    const [owner] = await ethers.getSigners()
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

    await contracts.registry.addOrEditPools(contracts.pools)
  })

  it('must not allow adding pools when paused', async () => {
    const [, bob] = await ethers.getSigners()

    const pauserRole = await contracts.registry._NS_ROLES_PAUSER()
    await contracts.registry.grantRole(pauserRole, bob.address)

    await contracts.registry.connect(bob).pause()

    await contracts.registry.addOrEditPools(contracts.pools)
      .should.be.rejectedWith('Pausable: paused')

    await contracts.registry.unpause()
  })
})
