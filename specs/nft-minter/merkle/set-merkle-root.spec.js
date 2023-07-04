const { ethers } = require('hardhat')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const { emptyBytes32 } = require('../../util/helper')

describe('Merkle Proof Minter: Set Merkle Root', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)
    await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('pauser'), owner.address)
  })

  it('must revert when merkle root is attempted without role proof:agent', async () => {
    const [, account] = await ethers.getSigners()

    await minter.connect(account).setMerkleRoot(emptyBytes32)
      .should.be.rejectedWith('AccessControl')
  })

  it('must not allow duplicate root.', async () => {
    await minter.setMerkleRoot(emptyBytes32)
      .should.be.rejectedWith('DuplicateRootError')
  })

  it('must not allow to set root when paused.', async () => {
    await minter.pause()
    await minter.setMerkleRoot(emptyBytes32)
      .should.be.rejectedWith('Pausable: paused')
  })
})
