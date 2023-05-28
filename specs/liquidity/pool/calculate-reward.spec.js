const { network, ethers } = require('hardhat')
const Enumerable = require('node-enumerable')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const config = require('../../../scripts/config')

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
    const { chainId } = network.config
    const blocksPerEpoch = config.blockTime.blocksPerEpoch[chainId]
    const blocksToMine = 3141592

    const { args, gaugePool } = contracts
    const candidates = [[a1, randomAmount()], [a2, randomAmount()]]

    const { key, emissionPerEpoch } = args.distribution[0]

    for (const candidate of candidates) {
      const [account, amount] = candidate
      await deposit(owner, account, contracts, key, amount)
    }

    await mine(blocksToMine)

    const reward = await gaugePool.calculateReward(key, a2.address)

    const totalWeight = ethers.BigNumber.from(Enumerable.from(candidates).select(x => BigInt(x[1])).sum())
    const myWeight = ethers.BigNumber.from(candidates[1][1])
    const emissionPerBlock = ethers.BigNumber.from(emissionPerEpoch).div(blocksPerEpoch)
    const estimated = emissionPerBlock.mul(blocksToMine).mul(myWeight).div(totalWeight)

    reward.should
      .be.greaterThan(0)
      .but.also.be.lessThan(emissionPerEpoch)
      .which.also.equals(estimated)
  })
})
