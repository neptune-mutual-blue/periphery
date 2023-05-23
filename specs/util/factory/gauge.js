const { deployPool } = require('./pool')
const helper = require('../helper')

const setGauge = async (signer) => {
  const { args, pods, npm, veNpm, store, protocol, registry } = await deployPool(signer)

  const epoch = 1
  const blocksPerEpoch = 5000
  const amountToDeposit = helper.ether(1_000_000)

  const distribution = args.candidates.map(x => {
    return {
      key: x.key,
      emissionPerEpoch: helper.getRandomNumber(500_000, 4_000_000)
    }
  })

  const [owner] = await ethers.getSigners()
  await npm.mint(owner.address, amountToDeposit)
  await npm.approve(registry.address, amountToDeposit)

  await registry.setGauge(epoch, amountToDeposit, distribution, blocksPerEpoch)

  return { args: { distribution, blocksPerEpoch, ...args }, pods, npm, veNpm, store, protocol, registry }
}

module.exports = { setGauge }
