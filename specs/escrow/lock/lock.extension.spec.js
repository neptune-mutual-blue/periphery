const { time } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const DAYS = 86400
const WEEKS = 7 * DAYS

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: lock extension', () => {
  let contracts, name, symbol

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
  })

  it('must correctly extend existing locks', async () => {
    const [owner, account2] = await ethers.getSigners()

    const amounts = [helper.ether(20_000), helper.ether(50_000)]
    const durations = [10, 20]
    const originalLockTimestamps = []
    const blockSecondsElapsed = [0, 0]
    const increaseTimeByWeeks = 200

    await contracts.npm.mint(owner.address, amounts[0])
    await contracts.npm.mint(account2.address, amounts[1])

    await contracts.npm.approve(contracts.veNpm.address, amounts[0])
    await contracts.npm.connect(account2).approve(contracts.veNpm.address, amounts[1])

    await contracts.veNpm.lock(amounts[0], durations[0]).should.not.be.rejected
    originalLockTimestamps.push(await time.latest())

    await contracts.veNpm.connect(account2).lock(amounts[1], durations[1]).should.not.be.rejected
    // first transaction after the previous vote escrow lock
    // increase the time offset
    blockSecondsElapsed[0]++

    originalLockTimestamps.push(await time.latest())

    await time.increase(increaseTimeByWeeks * WEEKS)

    await contracts.veNpm.lock(0, durations[0]).should.not.be.rejected
    blockSecondsElapsed[0]++
    blockSecondsElapsed[1]++

    ;(await contracts.veNpm._unlockAt(owner.address)).should.equal(originalLockTimestamps[0] + blockSecondsElapsed[0] + ((durations[0] + increaseTimeByWeeks) * WEEKS))

    await contracts.veNpm.connect(account2).lock(0, durations[1]).should.not.be.rejected
    blockSecondsElapsed[0]++
    blockSecondsElapsed[1]++

    ;(await contracts.veNpm._unlockAt(account2.address)).should.equal(originalLockTimestamps[1] + blockSecondsElapsed[1] + ((durations[1] + increaseTimeByWeeks) * WEEKS))
  })
})
