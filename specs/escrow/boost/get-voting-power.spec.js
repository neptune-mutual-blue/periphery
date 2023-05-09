const { time } = require('@nomicfoundation/hardhat-network-helpers')
const chalk = require('chalk')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const {getVotingPower} = require('../../util/calculate-boost')
const HOURS = 3600
const DAYS = 24 * HOURS

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: getVotingPower', () => {
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
    const veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.store.address, owner.address, name, symbol)

    contracts.veNpm = veNpm


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
    const signers = await ethers.getSigners()
    let go = true

    while(go) {
      for (let i = 0; i < amounts.length; i++) {
        const lockDuration = unlocks[i].sub(await time.latest())

        if(lockDuration < 1 * DAYS) {
          go = false
          continue
        }

        const actual = (await contracts.veNpm.getVotingPower(signers[i].address)).toString()     
        const expected = getVotingPower(amounts[i], lockDuration)
    
        actual.should.equal(expected)
        console.log('%s- %s Duration: %s / Solidity: %s / Javascript: %s.', ' '.repeat(4), chalk.green('[Voting Power]'), String(lockDuration).padStart(9, '0'), String(actual).padStart(24, '0'), expected)
      }

      await time.increase(helper.getRandomNumber(3, 15) * DAYS)
    }
  })
})
