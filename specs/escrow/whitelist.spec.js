
const factory = require('../util/factory')
const helper = require('../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Whitelisted Transfer', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow Token'
    symbol = 'veToken'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
  })

  it('must not allow transferring tokens by non-whitelisted address', async () => {
    const [owner, bob] = await ethers.getSigners()
    const amount = helper.ether(20_000)
    const duration = 10

    await contracts.npm.mint(owner.address, amount)
    await contracts.npm.approve(contracts.veToken.address, amount)
    await contracts.veToken.lock(amount, duration).should.not.be.rejected

    ;(await contracts.veToken._totalLocked()).should.equal(amount)
    ;(await contracts.veToken.balanceOf(owner.address)).should.equal(amount)

    await contracts.veToken.transfer(bob.address, amount)
      .should.be.revertedWithCustomError(contracts.veToken, 'TransferRestrictedError')

    await contracts.veToken.approve(bob.address, amount)
    await contracts.veToken.connect(bob).transferFrom(owner.address, bob.address, amount)
      .should.be.revertedWithCustomError(contracts.veToken, 'TransferRestrictedError')
  })

  it('must allow transferring tokens by whitelisted address', async () => {
    const [owner, bob] = await ethers.getSigners()
    const amount = helper.ether(20_000)

    ;(await contracts.veToken.balanceOf(owner.address)).should.equal(amount)

    await contracts.veToken.updateWhitelist([bob.address], [true])

    await contracts.veToken.approve(bob.address, amount)
    await contracts.veToken.connect(bob).transferFrom(owner.address, bob.address, amount)
      .should.not.be.rejected

    ;(await contracts.veToken.balanceOf(bob.address)).should.equal(amount)
    await contracts.veToken.updateWhitelist([bob.address], [false])
  })

  it('must not allow invalid arguments', async () => {
    await contracts.veToken.updateWhitelist([], [true])
      .should.be.revertedWithCustomError(contracts.veToken, 'NoAccountSpecifiedError')
  })

  it('must not allow invalid arguments', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.veToken.updateWhitelist([bob.address], [true, false])
      .should.be.revertedWithCustomError(contracts.veToken, 'RelatedArrayItemCountMismatchError')
  })
})
