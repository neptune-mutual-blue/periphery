const { ethers } = require('hardhat')
const helper = require('../../util/helper')
const { deployUpgradeable, deployProtocol, deploy } = require('../../util/factory')

describe('Merkle Proof Minter: Recover Ether', () => {
  let minter, nft, contracts, forceEther

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)
    forceEther = await deploy('ForceEther')

    await minter.grantRole(ethers.utils.formatBytes32String('recovery:agent'), owner.address)
  })

  it('must allow `ForceEther` contract to receive ethers', async () => {
    const [owner] = await ethers.getSigners()

    await owner.sendTransaction({
      to: forceEther.address,
      value: ethers.utils.parseEther('1')
    })

    const balance = await ethers.provider.getBalance(forceEther.address)
    balance.should.equal(helper.ether(1))
  })

  it('must allow `ForceEther` contract to destroy itself', async () => {
    await forceEther.destruct(minter.address)

    const balance = await ethers.provider.getBalance(minter.address)
    balance.should.equal(helper.ether(1))
  })

  it('must recover ETH sent to the contract', async () => {
    const receiver = helper.randomAddress()
    await minter.recoverEther(receiver)

    const balance = await ethers.provider.getBalance(receiver)
    balance.should.equal(helper.ether(1))
  })

  it('must not recover ETH when role is not recovery agent', async () => {
    const [, account] = await ethers.getSigners()

    const receiver = helper.randomAddress()
    await minter.connect(account).recoverEther(receiver).should.be.rejectedWith('AccessControl')
  })
})
