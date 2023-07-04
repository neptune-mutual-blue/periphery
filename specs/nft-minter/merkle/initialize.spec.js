const { ethers } = require('hardhat')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const { zerox } = require('../../util/helper')

describe('Merkle Proof Minter: Initializers', () => {
  let nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
  })

  it('must not be initialized with invalid arguments', async () => {
    const [owner] = await ethers.getSigners()

    // zero address checks
    await deployUpgradeable('MerkleProofMinter', zerox, contracts.npm.address, owner.address, owner.address)
      .should.be.rejectedWith('InvalidArgumentError')

    await deployUpgradeable('MerkleProofMinter', nft.address, zerox, owner.address, owner.address)
      .should.be.rejectedWith('InvalidArgumentError')

    await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, zerox, owner.address)
      .should.be.rejectedWith('InvalidArgumentError')

    await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, zerox)
      .should.be.rejectedWith('InvalidArgumentError')
  })

  it('must not be re-initialized', async () => {
    const [owner] = await ethers.getSigners()

    // re-initialize
    const minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await minter.initialize(nft.address, contracts.npm.address, owner.address, owner.address)
      .should.be.rejectedWith('Initializable')
  })
})
