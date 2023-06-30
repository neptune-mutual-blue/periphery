const { ethers } = require('hardhat')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')

describe('Merkle Proof Minter: Set Persona', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await deployProtocol(owner)

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('pauser'), owner.address)
  })

  it('must revert when persona is already set', async () => {
    await minter.setMyPersona([1, 1, 2])
    await minter.setMyPersona([1, 1, 2])
      .should.be.rejectedWith('PersonaAlreadySetError')
  })

  it('must revert when persona is an invalid value set', async () => {
    const [, account] = await ethers.getSigners()

    await minter.connect(account).setMyPersona([1, 1, 0])
      .should.be.rejectedWith('InvalidPersonaError')
  })

  it('must revert when contract is paused', async () => {
    const [, account] = await ethers.getSigners()

    await minter.pause()

    await minter.connect(account).setMyPersona([1, 1, 2])
      .should.be.rejectedWith('Pausable: paused')
  })
})
