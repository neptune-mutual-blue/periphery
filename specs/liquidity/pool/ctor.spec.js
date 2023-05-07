const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Liquidity Gauge Pool: Constructor', () => {
  let contracts, gaugePool

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await factory.setGauge(owner)
    gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', owner.address, contracts.veNpm.address, contracts.npm.address, contracts.registry.address, contracts.store.address, owner.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ; (await gaugePool._s()).should.equal(contracts.store.address)
    ; (await gaugePool._veNpm()).should.equal(contracts.veNpm.address)
    ; (await gaugePool._npm()).should.equal(contracts.npm.address)
    ; (await gaugePool._registry()).should.equal(contracts.registry.address)
    ; (await gaugePool._treasury()).should.equal(owner.address)
  })
})
