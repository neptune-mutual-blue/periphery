
const factory = require('../util/factory')
const helper = require('../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Whitelisted Transfer', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
  })

  it('must not allow transferring tokens by non-whitelisted address', async () => {
    const [owner, bob] = await ethers.getSigners()
    const amount = helper.ether(20_000)
    const duration = 10

    await contracts.npm.mint(owner.address, amount)
    await contracts.npm.approve(contracts.veNpm.address, amount)
    await contracts.veNpm.lock(amount, duration).should.not.be.rejected

    ;(await contracts.veNpm._totalLocked()).should.equal(amount)
    ;(await contracts.veNpm.balanceOf(owner.address)).should.equal(amount)

    await contracts.veNpm.transfer(bob.address, amount)
      .should.be.revertedWithCustomError(contracts.veNpm, 'TransferRestrictedError')

    await contracts.veNpm.approve(bob.address, amount)
    await contracts.veNpm.connect(bob).transferFrom(owner.address, bob.address, amount)
      .should.be.revertedWithCustomError(contracts.veNpm, 'TransferRestrictedError')
  })

  it('must allow transferring tokens by whitelisted address', async () => {
    const [owner, bob] = await ethers.getSigners()
    const amount = helper.ether(20_000)

    ;(await contracts.veNpm.balanceOf(owner.address)).should.equal(amount)

    await contracts.veNpm.updateWhitelist([bob.address], [true])

    await contracts.veNpm.approve(bob.address, amount)
    await contracts.veNpm.connect(bob).transferFrom(owner.address, bob.address, amount)
      .should.not.be.rejected

    ;(await contracts.veNpm.balanceOf(bob.address)).should.equal(amount)
    await contracts.veNpm.updateWhitelist([bob.address], [false])
  })

  it('must not allow invalid arguments', async () => {
    await contracts.veNpm.updateWhitelist([], [true])
      .should.be.revertedWithCustomError(contracts.veNpm, 'NoAccountSpecifiedError')
  })

  it('must not allow invalid arguments', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.veNpm.updateWhitelist([bob.address], [true, false])
      .should.be.revertedWithCustomError(contracts.veNpm, 'RelatedArrayItemCountMismatchError')
  })
})
