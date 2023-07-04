const { ethers } = require('hardhat')
const { boundaries } = require('../../util/boundaries')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const helper = require('../../util/helper')
const key = require('../../util/key')

describe('Merkle Proof Minter: Validate', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await deployProtocol(owner)

    nft = await deployUpgradeable('FakeNftMint', 'https://neptunemutual.com', owner.address, owner.address)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)
    await minter.setBoundaries(...boundaries)

    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)
  })

  it('must revert when invalid arguments is provided', async () => {
    const signers = await ethers.getSigners()

    const ppm = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, signers[0].address)
    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, ppm.address)

    await minter.setMyPersona([1, 2, 1])
    // (uint256 boundTokenId, uint8 level, bytes32 family, uint8 persona, uint256 tokenId)

    await minter.validate(0, 0, ethers.utils.formatBytes32String(''), 0, 0)
      .should.be.rejectedWith('InvalidTokenIdError')

    await minter.validate(0, 0, ethers.utils.formatBytes32String(''), 0, 10)
      .should.be.rejectedWith('InvalidTokenIdError')

    await minter.validate(50, 1, ethers.utils.formatBytes32String('Delphinus'), 1, 100001)
      .should.be.rejectedWith('InsufficientNpmBalanceError')

    await contracts.npm.mint(signers[0].address, helper.ether(1000))
    await contracts.npm.mint(signers[1].address, helper.ether(1000))
    await contracts.cxToken.mint(signers[0].address, helper.ether(20_000))
    await ppm.mint(contracts.cxToken.address, 50)

    await minter.validate(50, 1, ethers.utils.formatBytes32String('Delphinus'), 2, 100001)
      .should.be.rejectedWith('PersonaMismatchError')

    await minter.validate(50, 7, ethers.utils.formatBytes32String('Neptune'), 2, 100001)
      .should.be.rejectedWith('PersonaMismatchError')

    await nft.fakeMintSoulbound(49)
    await minter.validate(50, 1, ethers.utils.formatBytes32String('Delphinus'), 1, 49)
      .should.be.rejectedWith('TokenAlreadySoulbound')

    await minter.validate(50, 1, ethers.utils.formatBytes32String('Delphinus'), 1, 100000)
      .should.be.rejectedWith('TokenIdOutOfBoundsError')
    await minter.validate(50, 1, ethers.utils.formatBytes32String('Delphinus'), 1, 101001)
      .should.be.rejectedWith('TokenIdOutOfBoundsError')

    await minter.validate(50, 5, ethers.utils.formatBytes32String('Salacia'), 1, 150001)
      .should.be.rejectedWith('PreviousLevelMissingError')

    await minter.connect(signers[1]).validate(50, 1, ethers.utils.formatBytes32String('Delphinus'), 1, 100001)
      .should.be.rejectedWith('InvalidBindingError')

    await nft.fakeMint(100001)

    await minter.validate(50, 1, ethers.utils.formatBytes32String('Delphinus'), 1, 100001)
      .should.be.rejectedWith('TokenAlreadyMintedError')
  })
})
