const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Liquidity Gauge Pool: Constructor', () => {
  let contracts, gaugePool

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await factory.setGauge(owner)
    gaugePool = await factory.deploy('LiquidityGaugePool', contracts.veNpm.address, contracts.npm.address, contracts.registry.address, contracts.store.address, owner.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    ; (await gaugePool.globalStorage()).should.equal(contracts.store.address)
    ; (await gaugePool.getVeNpm()).should.equal(contracts.veNpm.address)
    ; (await gaugePool.getNpm()).should.equal(contracts.npm.address)
    ; (await gaugePool.getRegistry()).should.equal(contracts.registry.address)
    ; (await gaugePool.getTreasury()).should.equal(owner.address)
  })
})
