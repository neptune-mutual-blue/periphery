const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const { BigNumber } = require('ethers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Liquidity Gauge Pool: Withdraw Rewards', () => {
  let contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await factory.deployLiquidityGaugePool(owner)
  })

  it('must correctly withdraw rewards', async () => {
    const [owner, bob] = await ethers.getSigners()
    const { args, gaugePool } = contracts

    const key = args.distribution[0].key
    const amount = helper.ether(25_000)
    const BLOCKS_TO_MINE = 25

    await contracts.pods.primeDappsPod.mint(owner.address, amount)
    await contracts.pods.primeDappsPod.transfer(bob.address, amount)

    // Set operator
    await contracts.registry.setOperator(gaugePool.address)

    await contracts.pods.primeDappsPod.connect(bob).approve(gaugePool.address, amount)
    const depositTx = await gaugePool.connect(bob).deposit(key, amount)
    await depositTx.wait()

    mine(BLOCKS_TO_MINE)

    // Withdraw Rewards
    const withdrawTx = await gaugePool.connect(bob).withdrawRewards(key)
    const withdrawTxReceipt = await withdrawTx.wait()

    const epochEmission = args.distribution.find(x => x.key === key).emission
    const expected = BigNumber.from(epochEmission).div(args.blocksPerEpoch).mul(BLOCKS_TO_MINE + 1).toString()

    const rewardsWithdrawnEvent = withdrawTxReceipt.events.find(x => x.event === 'LiquidityGaugeRewardsWithdrawn')

    const actual = rewardsWithdrawnEvent.args.rewards.toString()
    actual.should.equal(expected)
  })
})
