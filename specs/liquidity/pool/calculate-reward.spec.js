const Enumerable = require('node-enumerable')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../../util/factory')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const randomAmount = () => helper.ether(helper.getRandomNumber(10_000, 100_000))

const deposit = async (owner, depositor, contracts, key, amount) => {
  await contracts.pods.primeDappsPod.connect(owner).mint(owner.address, amount)
  await contracts.pods.primeDappsPod.connect(owner).transfer(depositor.address, amount)

  await contracts.pods.primeDappsPod.connect(depositor).approve(contracts.gaugePool.address, amount)
  await contracts.gaugePool.connect(depositor).deposit(key, amount)
}

describe('Liquidity Gauge Pool: Calculate Reward without veNpm Boost', () => {
  let contracts

  beforeEach(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await factory.deployLiquidityGaugePool(owner)
  })

  it('must return correct reward amount', async () => {
    const [owner, a1, a2] = await ethers.getSigners()

    const { args, gaugePool } = contracts
    const candidates = [[a1, randomAmount()], [a2, randomAmount()]]

    const { key, emissionPerEpoch } = args.distribution[0]

    for (const candidate of candidates) {
      const [account, amount] = candidate
      await deposit(owner, account, contracts, key, amount)
    }

    await mine(1)

    const reward = await gaugePool.calculateReward(key, a2.address)
    const total = Enumerable.from(candidates).select(x => parseInt(x[1])).sum()
    const estimatedReward = Math.floor((emissionPerEpoch / args.blocksPerEpoch) * parseInt(candidates[1][1]) / total)

    reward.should
      .be.greaterThan(0)
      .but.also.be.lessThan(emissionPerEpoch)
      .which.also.equals(estimatedReward)
  })
})
