const helper = require('../util/key')
const { deployUpgradeable } = require('../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('NFT: Pause/Unpause', () => {
  let nft

  before(async () => {
    const [owner, bob] = await ethers.getSigners()
    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)

    const pausers = [bob.address]
    const statuses = [true]

    await nft.setPausers(pausers, statuses)
  })

  it('must allow pausers to pause', async () => {
    const [, bob] = await ethers.getSigners()

    await nft.connect(bob).pause()
    await nft.unpause()
  })

  it('must not allow non pausers to pause', async () => {
    await nft.pause()
      .should.be.revertedWithCustomError(nft, 'AccessDeniedError')
      .withArgs(helper.toBytes32('Pauser'))
  })

  it('must not allow non owners to unpause', async () => {
    const [, bob] = await ethers.getSigners()

    await nft.connect(bob).unpause()
      .should.be.rejectedWith('AccessDeniedError')
  })
})
