const { network } = require('hardhat')
const factory = require('../../util/factory')
const helper = require('../../util/helper')
const config = require('../../../scripts/config')

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Gauge Controller Registry: Constructor', () => {
  let npm, registry

  before(async () => {
    const [owner] = await ethers.getSigners()
    const { chainId } = network.config
    const blocksPerEpoch = config.blockTime.blocksPerEpoch[chainId]

    npm = await factory.deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
    registry = await factory.deployUpgradeable('GaugeControllerRegistry', blocksPerEpoch, owner.address, owner.address, [owner.address], npm.address)
  })

  it('must correctly set the state upon construction', async () => {
    const [owner] = await ethers.getSigners()

    const contractRewardToken = await registry._rewardToken()
    const isContractOwner = await registry.hasRole(helper.emptyBytes32, owner.address)

    contractRewardToken.should.equal(npm.address)
    isContractOwner.should.equal(true)
  })
})
