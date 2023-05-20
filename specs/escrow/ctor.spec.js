const factory = require('../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Constructor', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    const veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)

    contracts.veNpm = veNpm
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ; (await contracts.veNpm._underlyingToken()).should.equal(contracts.npm.address)
    ; (await contracts.veNpm.owner()).should.equal(owner.address)
    ; (await contracts.veNpm._feeTo()).should.equal(owner.address)
    ; (await contracts.veNpm.name()).should.equal(name)
    ; (await contracts.veNpm.symbol()).should.equal(symbol)
    ; (await contracts.veNpm.paused()).should.equal(false)
  })
})
