const chalk = require('chalk')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../../util/factory')
const key = require('../../util/key')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const DAYS = 86400

const matrix = [
  [0, 666_666, 555_555, 444_444, 333_333, 222_222, 111_111], // npm
  [0, 111_111, 222_222, 333_333, 444_444, 555_555, 666_666], // pod
  [0, '2596464070200000000000000', '2163720058500000000000000', '1730976046800000000000000', '1298232035100000000000000', '865488023400000000000000', '432744011700000000000000'],
  [0, '115644186028923463761358', '136052197535223256684566', '156460365446344232765540', '176868577671936450565846', '197276808962973109056386', '217685050201160328334855'],
  [0, '47619382243638195376386', '95237937767699671378434', '142856493291761147602704', '190475048815822624049196', '238093604339884100717910', '285712159863945577608846'],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0]
]

const _setup = async (signers, contracts, skipVeNPM) => {
  for (let i = 1; i <= 6; i++) {
    const account = signers[i]
    const [npm, pod] = matrix

    if (npm[i] > 0 && skipVeNPM === false) {
      await contracts.npm.mint(account.address, helper.ether(npm[i]))
      await contracts.npm.connect(account).approve(contracts.veNpm.address, helper.ether(npm[i]))
      await contracts.veNpm.connect(account).lock(helper.ether(npm[i]), 208)
    }

    // Mint and approve staking tokens in advance
    await contracts.fakePod.mint(account.address, helper.ether(pod[i]))
    await contracts.fakePod.connect(account).approve(contracts.gaugePool.address, helper.ether(pod[i]))
  }
}

describe('Compare Liquidity Gauge Pool Reward', () => {
  let contracts, info

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    const [owner] = signers
    contracts = {}

    contracts.npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, 'Vote Escrow NPM', 'veNPM')
    contracts.fakePod = await factory.deployUpgradeable('FakeToken', 'Yield Earning USDC', 'iUSDC-FOO')
    contracts.fakeRegistry = owner

    info = {
      key: key.toBytes32('foobar'),
      name: 'Foobar',
      info: key.toBytes32(''),
      lockupPeriodInBlocks: 100,
      epochDuration: 28 * DAYS,
      veBoostRatio: 1000,
      platformFee: helper.percentage(6.5),
      stakingToken: contracts.fakePod.address,
      veToken: contracts.veNpm.address,
      rewardToken: contracts.npm.address,
      registry: contracts.fakeRegistry.address,
      treasury: helper.randomAddress()
    }

    contracts.gaugePool = await factory.deployUpgradeable('LiquidityGaugePool', owner.address, info)

    await contracts.npm.mint(contracts.gaugePool.address, helper.ether(10_000_000))

    contracts.gaugePool.setEpoch(1, 0, helper.ether(1_000_000))
  })

  it('must correctly distribute rewards based on veNPM boost', async () => {
    const signers = await ethers.getSigners()
    await _setup(signers, contracts, false)

    const [, pod, evp, erVe] = matrix

    for (let i = 1; i <= 6; i++) {
      const account = signers[i]
      await contracts.gaugePool.connect(account).deposit(helper.ether(pod[i]))
    }

    time.increase(28 * DAYS)

    for (let i = 1; i <= 6; i++) {
      const account = signers[i]
      await contracts.gaugePool.connect(account).withdrawRewards()

      const rewardReceived = await contracts.npm.balanceOf(account.address)
      const votingPower = await contracts.veNpm.getVotingPower(account.address)

      votingPower.should.equal(evp[i])
      rewardReceived.should.equal(erVe[i])

      console.log('%s- %s Actual: %s / Expected: %s', ' '.repeat(4), chalk.green('[Voting Power]'), helper.weiAsToken(votingPower, 'NPM'), helper.weiAsToken(evp[i], 'NPM'))
      console.log('%s- %s Actual: %s / Expected: %s', ' '.repeat(4), chalk.green('[+veVP Reward]'), helper.weiAsToken(rewardReceived, 'NPM'), helper.weiAsToken(erVe[i], 'NPM'))
    }
  })

  it('must correctly distribute rewards based without veNPM boost', async () => {
    const signers = await ethers.getSigners()
    await _setup(signers, contracts, true)

    const [, pod, , , er] = matrix

    for (let i = 1; i <= 6; i++) {
      const account = signers[i]
      await contracts.gaugePool.connect(account).deposit(helper.ether(pod[i]))
    }

    time.increase(28 * DAYS)

    for (let i = 1; i <= 6; i++) {
      const account = signers[i]
      await contracts.gaugePool.connect(account).withdrawRewards()

      const rewardReceived = await contracts.npm.balanceOf(account.address)
      console.log('%s- %s Actual: %s / Expected: %s', ' '.repeat(4), chalk.green('[Reward]'), helper.weiAsToken(rewardReceived, 'NPM'), helper.weiAsToken(er[i], 'NPM'))
    }
  })
})
