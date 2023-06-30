const { ethers } = require('hardhat')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const key = require('../../util/key')
const { expect } = require('chai')

describe('Soulbound NFT Minter: Boundaries', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, owner.address)

    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)
  })

  it('must revert if non-admin tries to set boundaries.', async () => {
    const [, account] = await ethers.getSigners()

    await minter.connect(account).setBoundary(10001).should.be.rejectedWith('AccessControl')
  })

  it('must revert boundary is being shrunk.', async () => {
    await minter.setBoundary(9999).should.be.rejectedWith('InvalidBoundaryError')
  })

  it('must correctly set boundary.', async () => {
    await minter.setBoundary(10001)

    const newMax = await minter._max()

    expect(newMax.toNumber()).to.equal(10001)
  })
})
