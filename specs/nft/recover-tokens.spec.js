const { ethers } = require('hardhat')
const helper = require('../util/helper')
const { deployUpgradeable, deployProtocol } = require('../util/factory')

describe('NFT: Recover Token', () => {
  let nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)

    await nft.grantRole(ethers.utils.formatBytes32String('recovery:agent'), owner.address)
  })

  it('must not allow non recovery agents to recover tokens', async () => {
    const [, account] = await ethers.getSigners()
    const receiver = helper.randomAddress()

    await contracts.npm.mint(nft.address, helper.ether(5))
    await nft.connect(account).recoverToken(contracts.npm.address, receiver)
      .should.be.rejectedWith('AccessDeniedError')
  })

  it('must allow recovery agents to recover tokens', async () => {
    const receiver = helper.randomAddress()

    await contracts.npm.mint(nft.address, helper.ether(5))
    await nft.recoverToken(contracts.npm.address, receiver)

    const balance = await contracts.npm.balanceOf(receiver)
    balance.should.equal(helper.ether(10))
  })
})
