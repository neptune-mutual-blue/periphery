const { ethers } = require('hardhat')
const { deployUpgradeable } = require('../util/factory')

describe('NFT: Grant Roles', () => {
  let nft

  before(async () => {
    const [owner] = await ethers.getSigners()
    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)

    const pausers = [owner.address]
    const statuses = [true]

    await nft.setPausers(pausers, statuses)
  })

  it('must revert if no detail is provided.', async () => {
    await nft.grantRoles([]).should.be.rejectedWith('InvalidArgumentError')
  })

  it('must be able to grant multiple roles.', async () => {
    const [, account] = await ethers.getSigners()

    await nft.grantRoles([
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

    await nft.pause()

    await nft.grantRoles([
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
