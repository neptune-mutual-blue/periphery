const { ethers } = require('hardhat')
const { deployUpgradeable } = require('../util/factory')

describe('NFT: setBaseURI', () => {
  let nft

  before(async () => {
    const [owner] = await ethers.getSigners()
    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
  })

  it('must revert if invalid arguments.', async () => {
    await nft.setBaseUri('')
      .should.be.rejectedWith('InvalidArgumentError')
  })

  it('must set baseUri if valid arguments and is admin.', async () => {
    await nft.setBaseUri('https://test.neptunemutual.com')

    const baseURI = await nft._uri()

    baseURI.should.equal('https://test.neptunemutual.com')
  })

  it('must revert if not admin.', async () => {
    const [, bob] = await ethers.getSigners()

    await nft.connect(bob).setBaseUri('https://test.neptunemutual.com')
      .should.be.rejectedWith('AccessDeniedError')
  })
})
