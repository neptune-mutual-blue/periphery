const factory = require('../util/factory')
const { forceSendEther } = require('../util/factory/force-ether')
const helper = require('../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Recover Token', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
    contracts.weth = await factory.deployUpgradeable('FakeToken', 'Wrapped ETH', 'WETH')
  })

  it('must allow recovering tokens', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.weth.mint(owner.address, helper.ether(100_000_000))
    const receiver = helper.randomAddress()

    await contracts.weth.transfer(contracts.veNpm.address, helper.ether(12340))
    await contracts.veNpm.recoverToken(contracts.weth.address, receiver)

    const balance = await contracts.weth.balanceOf(receiver)
    balance.should.equal(helper.ether(12340))
  })

  it('must not throw when contract token balance is zero', async () => {
    const receiver = helper.randomAddress()

    await contracts.veNpm.recoverToken(contracts.weth.address, receiver)
      .should.not.be.rejected

    const balance = await contracts.weth.balanceOf(receiver)
    balance.should.equal(helper.ether('0'))
  })

  it('must not allow non owners to recover tokens', async () => {
    const [, , charlie] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.veNpm.connect(charlie).recoverToken(contracts.weth.address, receiver)
      .should.be.rejectedWith('Ownable: caller is not the owner')
  })
})

describe('Vote Escrow Token: Recover Ether', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
    contracts.weth = await factory.deployUpgradeable('FakeToken', 'Wrapped ETH', 'WETH')
  })

  it('must allow recovering ether', async () => {
    const [owner] = await ethers.getSigners()

    await forceSendEther(contracts.veNpm.address, owner)
    const receiver = helper.randomAddress()

    await contracts.veNpm.recoverEther(receiver)

    const balance = await owner.provider.getBalance(receiver)
    balance.should.equal(helper.ether(1))
  })

  it('must not throw when contract ether balance is zero', async () => {
    const [, bob] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.veNpm.recoverEther(receiver)
      .should.not.be.rejected

    const balance = await bob.provider.getBalance(receiver)
    balance.should.equal(helper.ether('0'))
  })

  it('must not allow non owners to recover ether', async () => {
    const [, , charlie] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.veNpm.connect(charlie).recoverEther(receiver)
      .should.be.rejectedWith('Ownable: caller is not the owner')
  })
})
