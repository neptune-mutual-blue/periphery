const { ethers } = require('hardhat')
const { boundaries } = require('../../util/boundaries')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')

describe('Merkle Proof Minter: Set Boundaries', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await deployProtocol(owner)

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('pauser'), owner.address)
  })

  it('must not allow without role proof:agent', async () => {
    const [, account] = await ethers.getSigners()

    // await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)
    await minter.connect(account).setBoundaries(...boundaries)
      .should.be.rejectedWith('AccessControl')
  })

  it('must handle invalid arguments', async () => {
    const testBoundaries = [...boundaries]

    testBoundaries[0] = []

    // await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)
    await minter.setBoundaries(...testBoundaries)
      .should.be.rejectedWith('RelatedArrayItemCountMismatchError')

    const testBoundaries2 = [...boundaries]

    testBoundaries2[1] = []

    await minter.setBoundaries(...testBoundaries2)
      .should.be.rejectedWith('RelatedArrayItemCountMismatchError')
  })

  it('must not allow to set boundaries when paused.', async () => {
    await minter.pause()
    await minter.setBoundaries(...boundaries)
      .should.be.rejectedWith('Pausable: paused')
  })
})
