const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')
const { forceSendEther } = require('../../util/factory/force-ether')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

describe('Liquidity Gauge Pool: Recover Token', () => {
  let contracts, info

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.weth = await factory.deployUpgradeable('FakeToken', 'Wrapped ETH', 'WETH')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    info = {
      key: key.toBytes32('foobar'),
      name: 'Foobar',
      info: key.toBytes32(''),
      epochDuration: 28 * DAYS,
      veBoostRatio: 1000,
      platformFee: helper.percentage(6.5),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.registry.address,
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
    await contracts.registry.addOrEditPools([contracts.gaugePool.address])

    const emission = helper.ether(100_00)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 28 * DAYS, distribution)

    // Make bob recovery agent
    const recoveryAgentRole = await contracts.gaugePool._NS_ROLES_RECOVERY_AGENT()
    await contracts.gaugePool.grantRole(recoveryAgentRole, bob.address)
  })

  it('must allow recovering tokens', async () => {
    const [owner, bob] = await ethers.getSigners()

    await contracts.weth.mint(owner.address, helper.ether(100_000_000))
    const receiver = helper.randomAddress()

    await contracts.weth.transfer(contracts.gaugePool.address, helper.ether(12340))
    await contracts.gaugePool.connect(bob).recoverToken(contracts.weth.address, receiver)

    const balance = await contracts.weth.balanceOf(receiver)
    balance.should.equal(helper.ether(12340))
  })

  it('must not throw when contract token balance is zero', async () => {
    const [, bob] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.gaugePool.connect(bob).recoverToken(contracts.weth.address, receiver)
      .should.not.be.rejected

    const balance = await contracts.weth.balanceOf(receiver)
    balance.should.equal(helper.ether('0'))
  })

  it('must not allow non recovery agents to recover tokens', async () => {
    const [, , charlie] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    const recoveryAgentRole = await contracts.gaugePool._NS_ROLES_RECOVERY_AGENT()
    await contracts.gaugePool.connect(charlie).recoverToken(contracts.weth.address, receiver)
      .should.be.rejectedWith(`AccessControl: account ${charlie.address.toLowerCase()} is missing role ${recoveryAgentRole}`)
  })
})

describe('Liquidity Gauge Pool: Recover Ether', () => {
  let contracts, info

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow Token', 'veToken')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    info = {
      key: key.toBytes32('foobar'),
      name: 'Foobar',
      info: key.toBytes32(''),
      epochDuration: 28 * DAYS,
      veBoostRatio: 1000,
      platformFee: helper.percentage(6.5),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veToken.address,
      rewardToken: contracts.npm.address,
      registry: contracts.registry.address,
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', info, owner.address, [])
    await contracts.registry.addOrEditPools([contracts.gaugePool.address])

    const emission = helper.ether(100_00)
    const distribution = [{ key: info.key, emission }]
    await contracts.npm.mint(owner.address, emission)
    await contracts.npm.approve(contracts.registry.address, emission)
    await contracts.registry.setGauge(1, emission, 28 * DAYS, distribution)

    // Make bob recovery agent
    const recoveryAgentRole = await contracts.gaugePool._NS_ROLES_RECOVERY_AGENT()
    await contracts.gaugePool.grantRole(recoveryAgentRole, bob.address)
  })

  it('must allow recovering ether', async () => {
    const [owner, bob] = await ethers.getSigners()

    await forceSendEther(contracts.gaugePool.address, owner)
    const receiver = helper.randomAddress()

    await contracts.gaugePool.connect(bob).recoverEther(receiver)

    const balance = await owner.provider.getBalance(receiver)
    balance.should.equal(helper.ether(1))
  })

  it('must not throw when contract ether balance is zero', async () => {
    const [, bob] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.gaugePool.connect(bob).recoverEther(receiver)
      .should.not.be.rejected

    const balance = await bob.provider.getBalance(receiver)
    balance.should.equal(helper.ether('0'))
  })

  it('must not allow to recover staking token', async () => {
    const [, bob] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.gaugePool.connect(bob).recoverToken(info.stakingToken, receiver)
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('malicious'))
  })

  it('must not allow to recover reward token', async () => {
    const [, bob] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.gaugePool.connect(bob).recoverToken(info.rewardToken, receiver)
      .should.be.revertedWithCustomError(contracts.gaugePool, 'InvalidArgumentError')
      .withArgs(key.toBytes32('malicious'))
  })

  it('must not allow non recovery agents to recover ether', async () => {
    const [, , charlie] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    const recoveryAgentRole = await contracts.gaugePool._NS_ROLES_RECOVERY_AGENT()
    await contracts.gaugePool.connect(charlie).recoverEther(receiver)
      .should.be.rejectedWith(`AccessControl: account ${charlie.address.toLowerCase()} is missing role ${recoveryAgentRole}`)
  })
})
