const { deployUpgradeable } = require('../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('NFT: setPausers', () => {
  let nft

  before(async () => {
    const [owner] = await ethers.getSigners()
    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
  })

  it('must correctly set pausers', async () => {
    const signers = await ethers.getSigners()
    const [, account1, , account3, , , , account7] = signers
    const pausers = [account1.address, account3.address, account7.address]
    const statuses = [true, true, true]

    await nft.setPausers(pausers, statuses)

    for (const account of signers) {
      const isPauser = pausers.indexOf(account.address) > -1
      ; (await nft._pausers(account.address)).should.equal(isPauser)
    }
  })
})
