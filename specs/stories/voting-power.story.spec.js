const { time, mine } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../util/factory')
const helper = require('../util/helper')
const DAYS = 86400
const WEEKS = 7 * DAYS
const MIN_LOCK_HEIGHT = 10

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: Voting Power Story', () => {
  let contracts, name, symbol, t0

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)
  })

  it('bob and charlie get NPM tokens', async () => {
    const [, bob, charlie] = await ethers.getSigners()
    const amounts = [helper.ether(20_000), helper.ether(50_000)]

    await contracts.npm.mint(bob.address, amounts[0])
    await contracts.npm.mint(charlie.address, amounts[1])

    ;(await contracts.npm.balanceOf(bob.address)).should.equal(amounts[0])
    ;(await contracts.npm.balanceOf(charlie.address)).should.equal(amounts[1])
  })

  it('bob locks 100 NPM at t0 for 208 weeks', async () => {
    const [, bob, charlie] = await ethers.getSigners()
    await contracts.npm.connect(bob).approve(contracts.veNpm.address, helper.ether(100))

    await contracts.veNpm.connect(bob).lock(helper.ether(100), 208)
    t0 = await time.latest()
    const latestBlockNumber = await time.latestBlock()

    ;(await contracts.veNpm._balances(bob.address)).should.equal(helper.ether(100))
    ;(await contracts.veNpm._unlockAt(bob.address)).should.equal(t0 + 208 * WEEKS)
    ;(await contracts.veNpm._minUnlockHeights(bob.address)).should.equal(latestBlockNumber + MIN_LOCK_HEIGHT)

    console.log('[Bob]      Voting Power at t0', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(400000000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })

  it('At t0 + 1 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week1 = t0 + 1 * WEEKS
    await time.setNextBlockTimestamp(week1)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 1 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 1 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(397340000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })

  it('At t0 + 2 weeks, charlie locks 200 NPM for 8 weeks', async () => {
    const [, , charlie] = await ethers.getSigners()
    await contracts.npm.connect(charlie).approve(contracts.veNpm.address, helper.ether(200))

    const week2 = t0 + 2 * WEEKS
    await time.setNextBlockTimestamp(week2)
    await contracts.veNpm.connect(charlie).lock(helper.ether(200), 8)

    ;(await contracts.veNpm._balances(charlie.address)).should.equal(helper.ether(200))
    ;(await contracts.veNpm._unlockAt(charlie.address)).should.equal(week2 + 8 * WEEKS)
  })

  it('At t0 + 3 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week3 = t0 + 3 * WEEKS
    await time.setNextBlockTimestamp(week3)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 3 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 3 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(392080000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(209540000000000000000))
  })

  it('At t0 + 4 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week4 = t0 + 4 * WEEKS
    await time.setNextBlockTimestamp(week4)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 4 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 4 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(389470000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(208140000000000000000))
  })

  it('At t0 + 5 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week5 = t0 + 5 * WEEKS
    await time.setNextBlockTimestamp(week5)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 5 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 5 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(386880000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(206760000000000000000))
  })

  it('At t0 + 6 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week6 = t0 + 6 * WEEKS
    await time.setNextBlockTimestamp(week6)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 6 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 6 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(384310000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(205400000000000000000))
  })

  it('At t0 + 7 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week7 = t0 + 7 * WEEKS
    await time.setNextBlockTimestamp(week7)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 7 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 7 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(381760000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(204020000000000000000))
  })

  it('At t0 + 8 week(s), charlie unlocks prematurely and receives 75 NPM', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const balanceBefore = await contracts.npm.balanceOf(bob.address)

    await mine(MIN_LOCK_HEIGHT)
    const week8 = t0 + 8 * WEEKS
    await time.setNextBlockTimestamp(week8)
    const tx = await contracts.veNpm.connect(bob).unlockPrematurely()
    const { events } = await tx.wait()

    const event = events.find(x => x.event === 'VoteEscrowUnlock')
    const balanceAfter = await contracts.npm.balanceOf(bob.address)

    event.args.penalty.should.equal(helper.ether(25))
    balanceAfter.should.equal(balanceBefore.toBigInt() + helper.ether(75))

    console.log('[Bob]      Voting Power at t0 + 8 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 8 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(0))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(202680000000000000000))
  })

  it('At t0 + 9 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()
    const balanceBefore = await contracts.npm.balanceOf(bob.address)

    await contracts.npm.connect(bob).approve(contracts.veNpm.address, helper.ether(100))

    const week9 = t0 + 9 * WEEKS
    await time.setNextBlockTimestamp(week9)
    await contracts.veNpm.connect(bob).lock(helper.ether(100), 4)

    const balanceAfter = await contracts.npm.balanceOf(bob.address)
    balanceAfter.should.equal(balanceBefore.toBigInt() - helper.ether(100))

    console.log('[Bob]      Voting Power at t0 + 9 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 9 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(102700000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(201320000000000000000))
  })

  it('At t0 + 10 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()
    const balanceBefore = await contracts.npm.balanceOf(charlie.address)

    await mine(MIN_LOCK_HEIGHT)
    const week10 = t0 + 10 * WEEKS
    await time.setNextBlockTimestamp(week10)
    await contracts.veNpm.connect(charlie).unlock()

    const balanceAfter = await contracts.npm.balanceOf(charlie.address)
    balanceAfter.should.equal(balanceBefore.toBigInt() + helper.ether(200))

    console.log('[Bob]      Voting Power at t0 + 10 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 10 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(102010000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })

  it('At t0 + 11 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week11 = t0 + 11 * WEEKS
    await time.setNextBlockTimestamp(week11)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 11 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 11 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(101340000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })

  it('At t0 + 12 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week12 = t0 + 12 * WEEKS
    await time.setNextBlockTimestamp(week12)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 12 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 12 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(100660000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })

  it('At t0 + 13 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week13 = t0 + 13 * WEEKS
    await time.setNextBlockTimestamp(week13)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 13 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 13 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(100000000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })

  it('At t0 + 14 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()

    const week14 = t0 + 14 * WEEKS
    await time.setNextBlockTimestamp(week14)
    await mine(1)

    console.log('[Bob]      Voting Power at t0 + 14 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 14 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(100000000000000000000))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })

  it('At t0 + 15 week(s)', async () => {
    const [, bob, charlie] = await ethers.getSigners()
    const balanceBefore = await contracts.npm.balanceOf(bob.address)

    await mine(MIN_LOCK_HEIGHT)
    const week15 = t0 + 15 * WEEKS
    await time.setNextBlockTimestamp(week15)
    await contracts.veNpm.connect(bob).unlock()

    const balanceAfter = await contracts.npm.balanceOf(bob.address)
    balanceAfter.should.equal(balanceBefore.toBigInt() + helper.ether(100))

    console.log('[Bob]      Voting Power at t0 + 15 week(s)', (await contracts.veNpm.getVotingPower(bob.address)).toString())
    console.log('[Charlie]  Voting Power at t0 + 15 week(s)', (await contracts.veNpm.getVotingPower(charlie.address)).toString())

    ;(await contracts.veNpm.getVotingPower(bob.address)).should.equal(BigInt(0))
    ;(await contracts.veNpm.getVotingPower(charlie.address)).should.equal(BigInt(0))
  })
})
