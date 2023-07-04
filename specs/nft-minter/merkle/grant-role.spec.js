const { ethers } = require('hardhat')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const key = require('../../util/key')

describe('Merkle Proof Minter: Grant Roles', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)

    await minter.grantRole(ethers.utils.formatBytes32String('pauser'), owner.address)
  })

  it('must revert if no detail is provided.', async () => {
    await minter.grantRoles([]).should.be.rejectedWith('InvalidArgumentError')
  })

  it('must be able to grant multiple roles.', async () => {
    const [, account] = await ethers.getSigners()

    await minter.grantRoles([
      {
        account: account.address,
        roles: [
          ethers.utils.formatBytes32String('recovery:agent'),
          ethers.utils.formatBytes32String('pauser')
        ]
      }
    ])
  })

  it('must not be able to grant roles when contract is paused.', async () => {
    const [, account] = await ethers.getSigners()

    await minter.pause()

    await minter.grantRoles([
      {
        account: account.address,
        roles: [
          ethers.utils.formatBytes32String('recovery:agent'),
          ethers.utils.formatBytes32String('pauser')
        ]
      }
    ]).should.be.rejectedWith('Pausable: paused')
  })
})
