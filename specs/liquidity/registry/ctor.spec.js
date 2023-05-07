const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Constructor', () => {
  let store, registry

  before(async () => {
    const [owner] = await ethers.getSigners()

    store = await factory.deployUpgradeable('Store', [owner.address], owner.address)
    registry = await factory.deployUpgradeable('GaugeControllerRegistry', owner.address, store.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    const contractStore = await registry._s()
    const contractOwner = await registry.owner()

    contractStore.should.equal(store.address)
    contractOwner.should.equal(owner.address)
  })
})
