const { ethers } = require('hardhat')
const helper = require('../../util/helper')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const key = require('../../util/key')

describe('Soulbound NFT Minter: Proof Validation', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, owner.address)
  })

  it('must revert if not valid proof', async () => {
    await minter.validateProof(helper.zerox)
      .should.be.rejectedWith('AccessDeniedError')

    await minter.validateProof(contracts.cxToken.address)
      .should.be.rejectedWith('InvalidProofError')

    const expiredCxToken = await deployUpgradeable('FakeCxToken', 'Fake CxToken', 'cxUSD', '1688058013')
    await contracts.store.setBool(key.qualifyCxToken(expiredCxToken.address), true)

    const [owner] = await ethers.getSigners()
    const amounts = [helper.ether(20_000), helper.ether(50_000)]
    await expiredCxToken.mint(owner.address, amounts[0])

    await minter.validateProof(expiredCxToken.address)
      .should.be.rejectedWith('ExpiredProofError')

    await contracts.cxToken.mint(owner.address, amounts[0])

    await minter.validateProof(contracts.cxToken.address)
      .should.be.rejectedWith('InsufficientNpmBalanceError')
  })

  it('must validate proof', async () => {
    const [owner] = await ethers.getSigners()

    await contracts.npm.mint(owner.address, helper.ether(1000))
    const amounts = [helper.ether(20_000), helper.ether(50_000)]
    await contracts.cxToken.mint(owner.address, amounts[0])

    await minter.validateProof(contracts.cxToken.address)
  })
})
