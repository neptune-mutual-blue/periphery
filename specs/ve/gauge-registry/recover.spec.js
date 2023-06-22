const { ethers } = require('hardhat')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const { forceSendEther } = require('../../util/factory/force-ether')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Liquidity Gauge Pool: Recover token', () => {
  let contracts

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.weth = await factory.deployUpgradeable('FakeToken', 'Wrapped ETH', 'WETH')

    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    // Make bob recovery agent
    const recoveryAgentRole = await contracts.registry.NS_ROLES_RECOVERY_AGENT()
    await contracts.registry.grantRole(recoveryAgentRole, bob.address)
  })

  it('must allow recovering tokens', async () => {
    const [owner, bob] = await ethers.getSigners()

    await contracts.weth.mint(owner.address, helper.ether(100_000_000))
    const receiver = helper.randomAddress()

    await contracts.weth.transfer(contracts.registry.address, helper.ether(12340))
    await contracts.registry.connect(bob).recoverToken(contracts.weth.address, receiver)

    const balance = await contracts.weth.balanceOf(receiver)
    balance.should.equal(helper.ether(12340))
  })

  it('must not throw when contract token balance is zero', async () => {
    const [, bob] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.registry.connect(bob).recoverToken(contracts.weth.address, receiver)
      .should.not.be.rejected

    const balance = await contracts.weth.balanceOf(receiver)
    balance.should.equal(helper.ether('0'))
  })

  it('must not allow non recovery agents to recover tokens', async () => {
    const [, , charlie] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    const recoveryAgentRole = await contracts.registry.NS_ROLES_RECOVERY_AGENT()
    await contracts.registry.connect(charlie).recoverToken(contracts.weth.address, receiver)
      .should.be.rejectedWith(`AccessControl: account ${charlie.address.toLowerCase()} is missing role ${recoveryAgentRole}`)
  })
})

describe('Liquidity Gauge Pool: Recover ETH', () => {
  let contracts

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')

    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)

    // Make bob recovery agent
    const recoveryAgentRole = await contracts.registry.NS_ROLES_RECOVERY_AGENT()
    await contracts.registry.grantRole(recoveryAgentRole, bob.address)
  })

  it('must allow recovering ether', async () => {
    const [owner, bob] = await ethers.getSigners()

    await forceSendEther(contracts.registry.address, owner)
    const receiver = helper.randomAddress()

    await contracts.registry.connect(bob).recoverEther(receiver)

    const balance = await owner.provider.getBalance(receiver)
    balance.should.equal(helper.ether(1))
  })

  it('must not throw when contract ether balance is zero', async () => {
    const [, bob] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.registry.connect(bob).recoverEther(receiver)
      .should.not.be.rejected

    const balance = await bob.provider.getBalance(receiver)
    balance.should.equal(helper.ether('0'))
  })

  it('must not allow non recovery agents to recover ether', async () => {
    const [, , charlie] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    const recoveryAgentRole = await contracts.registry.NS_ROLES_RECOVERY_AGENT()
    await contracts.registry.connect(charlie).recoverEther(receiver)
      .should.be.rejectedWith(`AccessControl: account ${charlie.address.toLowerCase()} is missing role ${recoveryAgentRole}`)
  })
})
