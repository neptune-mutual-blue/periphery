const factory = require('../../util/factory')
const helper = require('../../util/helper')
const pools = require('../../../scripts/ve/pools.baseGoerli.json')
const key = require('../../util/key')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Gauge Controller Registry: Set Gauge', () => {
  let contracts

  let total = 0
  const distribution = []

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')

    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)
    contracts.pools = []
    contracts.poolInfo = []

    pools.length.should.be.greaterThan(1)
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

    for (const pool of contracts.poolInfo) {
      const { key } = pool
      const emission = helper.getRandomNumber(100_000, 300_000)
      total += emission

      distribution.push({ key, emission: helper.ether(emission) })
    }
  })

  it('must correctly set gauge', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.npm.mint(owner.address, helper.ether(total))
    await contracts.npm.approve(contracts.registry.address, helper.ether(total))
    await contracts.registry.setGauge(1, helper.ether(total), 28 * DAYS, distribution)

    for (const pool of contracts.poolInfo) {
      ;(await pool.deployed._epoch()).should.equal(1)
    }
  })

  it('must allow setting even gauge before previous epoch ends', async () => {
    const [owner] = await ethers.getSigners()
    await contracts.npm.mint(owner.address, helper.ether(total))
    await contracts.npm.approve(contracts.registry.address, helper.ether(total))
    await contracts.registry.setGauge(2, helper.ether(total), 28 * DAYS, distribution)
      .should.not.be.rejected

    for (const pool of contracts.poolInfo) {
      ;(await pool.deployed._epoch()).should.equal(2)
    }

    await mine(1, { interval: 14 * DAYS })

    await contracts.npm.mint(owner.address, helper.ether(total))
    await contracts.npm.approve(contracts.registry.address, helper.ether(total))
    await contracts.registry.setGauge(3, helper.ether(total), 28 * DAYS, distribution)
      .should.not.be.rejected

    for (const pool of contracts.poolInfo) {
      ;(await pool.deployed._epoch()).should.equal(3)
    }

    // Complete epoch
    await mine(1, { interval: 28 * DAYS })
  })

  it('must not allow setting gauge for same epoch twice', async () => {
    const [owner] = await ethers.getSigners()
    await contracts.npm.mint(owner.address, helper.ether(total))
    await contracts.npm.approve(contracts.registry.address, helper.ether(total))

    await contracts.registry.setGauge(1, helper.ether(total), 28 * DAYS, distribution)
      .should.be.revertedWithCustomError(contracts.registry, 'InvalidGaugeEpochError')
  })

  it('must not allow setting gauge without distribution', async () => {
    await contracts.registry.setGauge(3, helper.ether(total), 28 * DAYS, [])
      .should.be.revertedWithCustomError(contracts.registry, 'InvalidArgumentError')
      .withArgs(key.toBytes32('distribution'))
  })

  it('must not allow setting gauge without epoch number', async () => {
    await contracts.registry.setGauge(0, helper.ether(total), 28 * DAYS, distribution)
      .should.be.revertedWithCustomError(contracts.registry, 'InvalidArgumentError')
      .withArgs(key.toBytes32('epoch'))
  })

  it('must not allow setting gauge without epoch duration', async () => {
    await contracts.registry.setGauge(3, helper.ether(total), 0, distribution)
      .should.be.revertedWithCustomError(contracts.registry, 'InvalidArgumentError')
      .withArgs(key.toBytes32('epochDuration'))
  })
})
