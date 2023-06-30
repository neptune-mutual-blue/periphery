const { ethers } = require('hardhat')
const helper = require('../../util/helper')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const key = require('../../../specs/util/key')

describe('Soulbound NFT Minter: Mint (Paused)', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, owner.address)

    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)

    await minter.grantRole(ethers.utils.formatBytes32String('pauser'), owner.address)
  })

  it('must not be able to mint when contract is paused.', async () => {
    const [owner, account] = await ethers.getSigners()

    await contracts.npm.mint(owner.address, helper.ether(1000))
    const amounts = [helper.ether(20_000), helper.ether(50_000)]
    await contracts.cxToken.mint(owner.address, amounts[0])

    await minter.connect(account).pause().should.be.rejectedWith('AccessControl')

    await minter.pause()

    await minter.mint(contracts.cxToken.address, 50).should.be.rejectedWith('Pausable: paused')
  })

  it('can only be unpaused by admin', async () => {
    const [, account] = await ethers.getSigners()
    await minter.connect(account).unpause().should.be.rejectedWith('AccessControl')

    await minter.unpause()
  })
})
