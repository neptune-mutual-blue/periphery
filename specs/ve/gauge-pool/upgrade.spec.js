const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const { upgrades } = require('hardhat')

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
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.registry.address,
      poolInfo: {
        name: 'Foobar',
        info: key.toBytes32(''),
        epochDuration: 28 * DAYS,
        veBoostRatio: 1000,
        platformFee: helper.percentage(6.5),
        treasury: helper.randomAddress()
      }
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
    await contracts.registry.addOrEditPools([contracts.gaugePool.address])
  })

  it('must correctly upgrade', async () => {
    await factory.validateUpgrade('LiquidityGaugePool', 'FakeLiquidityGaugePoolV2')

    const previous = await upgrades.erc1967.getImplementationAddress(contracts.gaugePool.address)
    const ContractFactory = await ethers.getContractFactory('FakeLiquidityGaugePoolV2')
    const v2 = await upgrades.upgradeProxy(contracts.gaugePool, ContractFactory)
    const current = await upgrades.erc1967.getImplementationAddress(v2.address)

    previous.should.not.equal(current)

    const addr = helper.randomAddress()
    await v2.setNewStorageVariable(addr)

    ;(await v2._newStorageVariable()).should.equal(addr)
  })
})
