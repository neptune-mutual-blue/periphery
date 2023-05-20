const factory = require('../../util/factory')
const helper = require('../../util/helper')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Constructor', () => {
  let npm, registry

  before(async () => {
    const [owner] = await ethers.getSigners()

    npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    registry = await factory.deployUpgradeable('GaugeControllerRegistry', owner.address, owner.address, [owner.address], npm.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    const contractRewardToken = await registry._rewardToken()
    const isContractOwner = await registry.hasRole(helper.emptyBytes32, owner.address)

    contractRewardToken.should.equal(npm.address)
    isContractOwner.should.equal(true)
  })
})
