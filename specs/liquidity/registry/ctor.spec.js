const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Constructor', () => {
  let store, registry

  before(async () => {
    const [owner] = await ethers.getSigners()

    store = await factory.deploy('Store', [owner.address], owner.address)
    registry = await factory.deploy('GaugeControllerRegistry', store.address, owner.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    const contractStore = await registry.globalStorage()
    const contractOwner = await registry.owner()

    contractStore.should.equal(store.address)
    contractOwner.should.equal(owner.address)
  })
})
