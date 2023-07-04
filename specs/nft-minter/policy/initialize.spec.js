const { ethers } = require('hardhat')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const { zerox } = require('../../util/helper')

describe('Soulbound NFT Minter: Initializers', () => {
  let nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
  })

  it('must not be initialized with invalid arguments', async () => {
    const [owner] = await ethers.getSigners()

    // zero address store
    await deployUpgradeable('PolicyProofMinter', zerox, nft.address, 1, 10000, owner.address)
      .should.be.rejectedWith('InvalidArgumentError')

    // zero address nft
    await deployUpgradeable('PolicyProofMinter', contracts.store.address, zerox, 1, 10000, owner.address)
      .should.be.rejectedWith('InvalidArgumentError')

    // zero address admin
    await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, zerox)
      .should.be.rejectedWith('InvalidArgumentError')

    // min > max
    await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 10000, 1, owner.address)
      .should.be.rejectedWith('InvalidArgumentError')
  })

  it('must not be re-initialized', async () => {
    const [owner] = await ethers.getSigners()

    // re-initialize
    const minter = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, owner.address)

    await minter.initialize(contracts.store.address, nft.address, 1, 10005, owner.address)
      .should.be.rejectedWith('Initializable')
  })
})
