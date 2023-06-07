const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const { BigNumber } = require('ethers')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Liquidity Gauge Pool: Withdraw', () => {
  let contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await factory.deployLiquidityGaugePool(owner)
  })

  it('must correctly withdraw', async () => {
    const [owner, bob] = await ethers.getSigners()
    const { args, gaugePool } = contracts

    const key = args.distribution[0].key
    const amount = helper.ether(25_000)

    const pool = await contracts.registry._pools(key)
    const BLOCKS_TO_MINE = pool.staking.lockupPeriodInBlocks.toNumber() + 10

    await contracts.pods.primeDappsPod.mint(owner.address, amount)
    await contracts.pods.primeDappsPod.transfer(bob.address, amount)

    // Set operator
    await contracts.registry.setOperator(gaugePool.address)

    const balanceBefore = await contracts.pods.primeDappsPod.connect(bob).balanceOf(bob.address)

    await contracts.pods.primeDappsPod.connect(bob).approve(gaugePool.address, amount)
    const depositTx = await gaugePool.connect(bob).deposit(key, amount)
    await depositTx.wait()

    mine(BLOCKS_TO_MINE)

    // Withdraw
    const withdrawTx = await gaugePool.connect(bob).withdraw(key, amount)
    const withdrawTxReceipt = await withdrawTx.wait()

    const epochEmission = args.distribution.find(x => x.key === key).emission
    const expectedRewards = BigNumber.from(epochEmission).div(args.blocksPerEpoch).mul(BLOCKS_TO_MINE + 1).toString()

    const rewardsWithdrawnEvent = withdrawTxReceipt.events.find(x => x.event === 'LiquidityGaugeRewardsWithdrawn')

    const actualRewards = rewardsWithdrawnEvent.args.rewards.toString()
    actualRewards.should.equal(expectedRewards)

    const balanceAfter = await contracts.pods.primeDappsPod.connect(bob).balanceOf(bob.address)
    balanceAfter.should.equal(balanceBefore)
  })
})
