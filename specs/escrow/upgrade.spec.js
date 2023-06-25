const { ethers, upgrades } = require('hardhat')
const factory = require('../util/factory')
const helper = require('../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Upgradeability', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ; (await contracts.veNpm._underlyingToken()).should.equal(contracts.npm.address)
    ; (await contracts.veNpm.owner()).should.equal(owner.address)
    ; (await contracts.veNpm._feeTo()).should.equal(owner.address)
    ; (await contracts.veNpm.name()).should.equal(name)
    ; (await contracts.veNpm.symbol()).should.equal(symbol)
    ; (await contracts.veNpm.paused()).should.equal(false)
  })

  it('must correctly upgrade', async () => {
    const [owner, account1] = await ethers.getSigners()

    const previous = await upgrades.erc1967.getImplementationAddress(contracts.veNpm.address)
    const ContractFactory = await ethers.getContractFactory('FakeVoteEscrowTokenV2')
    const v2 = await upgrades.upgradeProxy(contracts.veNpm, ContractFactory)
    const current = await upgrades.erc1967.getImplementationAddress(v2.address)

    previous.should.not.equal(current)

    // Custom post-upgrade initializer function
    await v2.upgradeToV2(account1.address)

    // Check if the `lock` feature still works
    const amount = helper.ether(100_000)

    await contracts.npm.mint(owner.address, amount)
    await contracts.npm.approve(contracts.veNpm.address, amount)

    await v2.lock(amount, 100).should.not.be.rejected

    // Proxy address is same
    v2.address.should.equal(contracts.veNpm.address)

    ; (await v2._underlyingToken()).should.equal(contracts.npm.address)
    ; (await v2.owner()).should.equal(owner.address)
    ; (await v2._feeTo()).should.equal(owner.address)
    ; (await v2.name()).should.equal(name)
    ; (await v2.symbol()).should.equal(symbol)
    ; (await v2.paused()).should.equal(false)

    // Ensure the variables initialized after the upgrade are correctly set
    ;(await v2._treasury()).should.equal(account1.address)
    ;(await v2._lastInitializedOn()).should.be.greaterThan(v2.deployTransaction.blockNumber)
    ;(await v2._members(owner.address)).should.equal(true)
    ;(await v2._members(account1.address)).should.equal(false)
    ;(await v2._boosts(owner.address)).should.equal(10)
    ;(await v2._boosts(account1.address)).should.equal(0)
    ;(await v2._name()).should.equal('Fake')
  })
})
