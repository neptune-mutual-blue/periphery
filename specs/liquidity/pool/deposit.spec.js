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
    const [owner] = await ethers.getSigners()
    const { args, gaugePool } = contracts

    const key = args.distribution[0].key
    const amount = helper.ether(25_000)

    await contracts.pods.primeDappsPod.mint(owner.address, amount)
    await contracts.pods.primeDappsPod.approve(gaugePool.address, amount)

    await gaugePool.deposit(key, amount)
  })
})
