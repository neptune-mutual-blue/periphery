const { ethers } = require('hardhat')
const { deployUpgradeable } = require('../util/factory')
const { zerox } = require('../util/helper')

describe('NFT: Initializer', () => {
  it('must not be initialized with invalid parameters', async () => {
    const [owner] = await ethers.getSigners()

    await deployUpgradeable('NeptuneLegends', '', zerox, zerox)
      .should.be.rejectedWith('InvalidArgumentError')
    await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', zerox, zerox)
      .should.be.rejectedWith('InvalidArgumentError')
    await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, zerox)
      .should.be.rejectedWith('InvalidArgumentError')

    const nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)

    await nft.initialize('https://neptunemutual.com', owner.address, owner.address)
      .should.be.rejectedWith('Initializable')
  })
})
