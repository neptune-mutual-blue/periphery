const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Constructor', () => {
  let contracts, info

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.fakeRegistry = owner

    info = {
      key: key.toBytes32('foobar'),
      name: 'Foobar',
      info: key.toBytes32(''),
      lockupPeriodInBlocks: 100,
      epochDuration: 28 * DAYS,
      veBoostRatio: 1000,
      platformFee: helper.percentage(6.5),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.fakeRegistry.address,
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', owner.address, info)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ;(await contracts.gaugePool._epoch()).should.equal(0)
    ;(await contracts.gaugePool.getKey()).should.equal(info.key)
    ;(await contracts.gaugePool.hasRole(helper.emptyBytes32, owner.address)).should.equal(true)

    const _info = await contracts.gaugePool._poolInfo()

    _info.key.should.equal(info.key)
    _info.name.should.equal(info.name)
    _info.info.should.equal(info.info)
    _info.lockupPeriodInBlocks.should.equal(info.lockupPeriodInBlocks)
    _info.epochDuration.should.equal(28 * DAYS)
    _info.veBoostRatio.should.equal(1000)
    _info.platformFee.should.equal(info.platformFee)
    _info.stakingToken.should.equal(contracts.fakePod.address)
    _info.veToken.should.equal(contracts.veToken.address)
    _info.rewardToken.should.equal(contracts.npm.address)
    _info.registry.should.equal(contracts.fakeRegistry.address)
    _info.treasury.should.equal(info.treasury)
  })

  it('must not allow to be initialized twice', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.gaugePool.initialize(owner.address, info)
      .should.be.rejectedWith('Initializable: contract is already initialized')
  })
})
