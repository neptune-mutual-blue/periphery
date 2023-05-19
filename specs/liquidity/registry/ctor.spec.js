const factory = require('../../util/factory')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Constructor', () => {
  let npm, registry

  before(async () => {
    const [owner] = await ethers.getSigners()

    npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    registry = await factory.deployUpgradeable('GaugeControllerRegistry', owner.address, npm.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    const contractRewardToken = await registry._rewardToken()
    const contractOwner = await registry.owner()

    contractRewardToken.should.equal(npm.address)
    contractOwner.should.equal(owner.address)
  })
})
