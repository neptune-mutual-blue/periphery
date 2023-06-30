const { ethers } = require('hardhat')
const helper = require('../../util/helper')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const key = require('../../util/key')

describe('Soulbound NFT Minter: TokenAlreadySoulbound', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('FakeNoMintedNft', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, owner.address)
    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)
  })

  it('must reject with TokenAlreadySoulbound if minted twice.', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.npm.mint(owner.address, helper.ether(1000))
    const amounts = [helper.ether(20_000), helper.ether(50_000)]
    await contracts.cxToken.mint(owner.address, amounts[0])

    await minter.mint(contracts.cxToken.address, 50)
    await minter.mint(contracts.cxToken.address, 50).should.be.rejectedWith('TokenAlreadySoulbound')
  })
})
