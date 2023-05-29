const { deployPool } = require('./pool')
const helper = require('../helper')

const setGauge = async (signer) => {
  const { args, pods, npm, veNpm, store, protocol, registry } = await deployPool(signer)

  const epoch = 1
  const amountToDeposit = helper.ether(1_000_000)

  const distribution = args.candidates.map(x => {
    return {
      key: x.key,
      emissionPerEpoch: helper.ether(helper.getRandomNumber(20_000, 200_000))
    }
  })

  const [owner] = await ethers.getSigners()
  await npm.mint(owner.address, amountToDeposit)
  await npm.approve(registry.address, amountToDeposit)

  await registry.setGauge(epoch, amountToDeposit, distribution)

  return { args: { distribution, ...args }, pods, npm, veNpm, store, protocol, registry }
}

module.exports = { setGauge }
