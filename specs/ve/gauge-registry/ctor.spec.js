const factory = require('../../util/factory')
const key = require('../../util/key')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Constructor', () => {
  let contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')

    contracts.registry = await factory.deployUpgradeable('GaugeControllerRegistry', 0, owner.address, owner.address, [owner.address], contracts.npm.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ;(await contracts.registry._epoch()).should.equal(0)
    ;(await contracts.registry.hasRole(key.toBytes32(''), owner.address)).should.equal(true)
    ;(await contracts.registry.hasRole(key.toBytes32('role:gauge:agent'), owner.address)).should.equal(true)
    ;(await contracts.registry.hasRole(key.toBytes32('role:pauser'), owner.address)).should.equal(true)
    ;(await contracts.registry._rewardToken()).should.equal(contracts.npm.address)
  })
})
