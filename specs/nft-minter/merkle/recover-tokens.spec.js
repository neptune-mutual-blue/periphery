const { ethers } = require('hardhat')
const helper = require('../../util/helper')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')

describe('Merkle Proof Minter: Recover Token', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('recovery:agent'), owner.address)
  })

  it('must not allow non recovery agents to recover tokens', async () => {
    const [, account] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.npm.mint(minter.address, helper.ether(5))
    await minter.connect(account).recoverToken(contracts.npm.address, receiver).should.be.rejectedWith('AccessControl')
  })

  it('must allow recovery agents to recover tokens', async () => {
    const receiver = helper.randomAddress()

    await contracts.npm.mint(minter.address, helper.ether(5))
    await minter.recoverToken(contracts.npm.address, receiver)

    const balance = await contracts.npm.balanceOf(receiver)
    balance.should.equal(helper.ether(10))
  })
})
