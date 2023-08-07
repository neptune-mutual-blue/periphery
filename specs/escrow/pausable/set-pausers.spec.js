const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: setPausers', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow Token'
    symbol = 'veToken'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
  })

  it('must correctly set pausers', async () => {
    const signers = await ethers.getSigners()
    const [, account1, , account3, , , , account7] = signers
    const pausers = [account1.address, account3.address, account7.address]
    const statuses = [true, true, true]

    await contracts.veToken.setPausers(pausers, statuses)

    for (const account of signers) {
      const isPauser = pausers.indexOf(account.address) > -1
      ; (await contracts.veToken._pausers(account.address)).should.equal(isPauser)
    }
  })
})
