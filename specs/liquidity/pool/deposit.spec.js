const factory = require('../../util/factory')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Liquidity Gauge Pool: Deposit', () => {
  let contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await factory.deployLiquidityGaugePool(owner)
  })

  it('must correctly deposit', async () => {
    const [owner, bob] = await ethers.getSigners()
    const { args, gaugePool } = contracts

    const key = args.distribution[0].key
    const amount = helper.ether(25_000)

    await contracts.pods.primeDappsPod.mint(owner.address, amount)
    await contracts.pods.primeDappsPod.transfer(bob.address, amount)

    await contracts.pods.primeDappsPod.connect(bob).approve(gaugePool.address, amount)
    await gaugePool.connect(bob).deposit(key, amount)

    const balanceAfter = await contracts.pods.primeDappsPod.connect(bob).balanceOf(bob.address)
    balanceAfter.should.equal('0')
  })
})
