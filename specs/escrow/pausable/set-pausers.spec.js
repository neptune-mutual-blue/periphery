const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: setPausers', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    const veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.store.address, owner.address, name, symbol)

    contracts.veNpm = veNpm
  })

  it('must correctly set pausers', async () => {
    const signers = await ethers.getSigners()
    const [, account1, , account3, , , , account7] = signers
    const pausers = [account1.address, account3.address, account7.address]
    const statuses = [true, true, true]

    await contracts.veNpm.setPausers(pausers, statuses)

    for(const account of signers) {
      const isPauser = pausers.indexOf(account.address) > -1
      ; (await contracts.veNpm._pausers(account.address)).should.equal(isPauser)
    }
  })
})
