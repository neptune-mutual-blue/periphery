const { time } = require('@nomicfoundation/hardhat-network-helpers')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const key = require('../../util/key')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Vote Escrow Token: unlock', () => {
  let contracts, name, symbol, durations, amounts

  before(async () => {
    name = 'Vote Escrow NPM'
    symbol = 'veNPM'

    const [owner, account2] = await ethers.getSigners()
    contracts = await factory.deployProtocol(owner)
    contracts.veNpm = await factory.deployUpgradeable('VoteEscrowToken', owner.address, contracts.npm.address, owner.address, name, symbol)

    await contracts.store.setBool(key.qualifyMember(contracts.veNpm.address), true)

    amounts = [helper.ether(20_000), helper.ether(50_000)]
    durations = [10, 20]

    await contracts.npm.mint(owner.address, amounts[0])
    await contracts.npm.mint(account2.address, amounts[1])

    await contracts.npm.approve(contracts.veNpm.address, amounts[0])
    await contracts.npm.connect(account2).approve(contracts.veNpm.address, amounts[1])

    await contracts.veNpm.lock(amounts[0], durations[0]).should.not.be.rejected
    await contracts.veNpm.connect(account2).lock(amounts[1], durations[1]).should.not.be.rejected
  })

  it('must allow unlocking as soon as the lock period is over', async () => {
    const signers = await ethers.getSigners()

    for (let i = 0; i < 2; i++) {
      const account = signers[i]
      const unlocks = await contracts.veNpm._unlockAt(account.address)

      await time.increaseTo(unlocks)

      ;(await contracts.npm.balanceOf(account.address)).should.equal(0)
      await contracts.veNpm.approve(contracts.veNpm.address, amounts[i])
      await contracts.veNpm.connect(account).unlock()
      ;(await contracts.npm.balanceOf(account.address)).should.equal(amounts[i])
    }
  })

  it('must not allow unlocking 0 amount', async () => {
    const signers = await ethers.getSigners()

    for (let i = 0; i < 2; i++) {
      const account = signers[i]
      await contracts.veNpm.connect(account).unlock()
        .should.be.revertedWithCustomError(contracts.veNpm, 'ZeroAmountError')
    }
  })
})
