const factory = require('../../util/factory')
const helper = require('../../util/key')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Pause/Unpause', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner, bob] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)

    const pausers = [bob.address]
    const statuses = [true]

    await contracts.veNpm.setPausers(pausers, statuses)
  })

  it('must allow pausers to pause', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.veNpm.connect(bob).pause()
    await contracts.veNpm.unpause()
  })

  it('must not allow non pausers to pause', async () => {
    await contracts.veNpm.pause()
      .should.be.revertedWithCustomError(contracts.veNpm, 'AccessDeniedError')
      .withArgs(helper.toBytes32('Pauser'))
  })

  it('must not allow non owners to unpause', async () => {
    const [, bob] = await ethers.getSigners()

    await contracts.veNpm.connect(bob).unpause()
      .should.be.rejectedWith('Ownable: caller is not the owner')
  })
})
