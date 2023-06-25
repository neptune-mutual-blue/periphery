const { time } = require('@nomicfoundation/hardhat-network-helpers')
const chalk = require('chalk')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const { calculateBoost } = require('../../util/calculate-boost')
const HOURS = 3600
const DAYS = 24 * HOURS

const BOOST_FLOOR = 10_000
const BOOST_CEILING = 40_000

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: calculateBoost', () => {
  let contracts, amounts, durations, timestamps, unlocks

  before(async () => {
    const name = 'Vote Escrow NPM'
    const symbol = 'veNPM'

    amounts = [helper.ether(20_000), helper.ether(50_000)]
    durations = [208, 160]
    timestamps = []
    unlocks = []

    const [owner, account2] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)

    await contracts.npm.mint(owner.address, amounts[0])
    await contracts.npm.mint(account2.address, amounts[1])

    await contracts.npm.approve(contracts.veNpm.address, amounts[0])
    await contracts.npm.connect(account2).approve(contracts.veNpm.address, amounts[1])

    await contracts.veNpm.lock(amounts[0], durations[0]).should.not.be.rejected
    timestamps.push(await time.latest())

    await contracts.veNpm.connect(account2).lock(amounts[1], durations[1]).should.not.be.rejected
    timestamps.push(await time.latest())

    unlocks.push(await contracts.veNpm._unlockAt(owner.address))
    unlocks.push(await contracts.veNpm._unlockAt(account2.address))
  })

  it('must correctly return voting power', async () => {
    let go = true

    while (go) {
      for (let i = 0; i < amounts.length; i++) {
        const lockDuration = unlocks[i].sub(await time.latest())

        if (lockDuration < 1 * DAYS) {
          go = false
          continue
        }

        const actual = (await contracts.veNpm.calculateBoost(lockDuration)).toString()
        const expected = BigInt(Math.floor(calculateBoost(lockDuration))).toString()

        actual.should.equal(expected)
        console.log('%s- %s Duration: %s / Solidity: %s / Javascript: %s.', ' '.repeat(4), chalk.green('[Boost]'), String(lockDuration).padStart(9, '0'), actual, expected)
      }

      await time.increase(helper.getRandomNumber(3, 15) * DAYS)
    }
  })

  it('must correctly return boost when duration is too low', async () => {
    const actual = (await contracts.veNpm.calculateBoost(0)).toString()
    actual.should.equal(BOOST_FLOOR.toString())
  })

  it('must correctly return boost when duration is too high', async () => {
    const actual = (await contracts.veNpm.calculateBoost(50_000 * DAYS)).toString()
    actual.should.equal(BOOST_CEILING.toString())
  })
})
