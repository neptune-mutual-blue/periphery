const factory = require('../../util/factory')
const helper = require('../../util/key')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Pause/Unpause', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow Token'
    symbol = 'veToken'

    const [owner, bob] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)

    const pausers = [bob.address]
    const statuses = [true]

    await contracts.veToken.setPausers(pausers, statuses)
  })

  it('must allow pausers to pause', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.veToken.connect(bob).pause()
    await contracts.veToken.unpause()
  })

  it('must not allow non pausers to pause', async () => {
    await contracts.veToken.pause()
      .should.be.revertedWithCustomError(contracts.veToken, 'AccessDeniedError')
      .withArgs(helper.toBytes32('Pauser'))
  })

  it('must not allow non owners to unpause', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.veToken.connect(bob).unpause()
      .should.be.rejectedWith('Ownable: caller is not the owner')
  })
})
