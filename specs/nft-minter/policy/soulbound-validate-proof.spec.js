const { ethers } = require('hardhat')
const helper = require('../../util/helper')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')

describe('Soul bound nft mint validation', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, owner.address)
  })

  it('must validate proof', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.npm.mint(owner.address, helper.ether(1000))
    const amounts = [helper.ether(20_000), helper.ether(50_000)]
    await contracts.cxToken.mint(owner.address, amounts[0])

    await minter.validateProof(contracts.cxToken.address)
  })
})
