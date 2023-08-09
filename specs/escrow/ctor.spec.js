const factory = require('../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Constructor', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow Token'
    symbol = 'veToken'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veToken = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ; (await contracts.veToken._underlyingToken()).should.equal(contracts.npm.address)
    ; (await contracts.veToken.owner()).should.equal(owner.address)
    ; (await contracts.veToken._feeTo()).should.equal(owner.address)
    ; (await contracts.veToken.name()).should.equal(name)
    ; (await contracts.veToken.symbol()).should.equal(symbol)
    ; (await contracts.veToken.paused()).should.equal(false)
  })
})
