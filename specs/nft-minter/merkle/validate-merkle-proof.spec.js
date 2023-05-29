const { ethers } = require('hardhat')
const { boundaries } = require('../../util/boundaries')
const { generateTree, parseLeaf } = require('../../util/tree')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const { getDemoLeaves, getDemoLeavesRaw } = require('../../util/demo-leaves')
const helper = require('../../util/helper')

describe('Merkle Proof Validation', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await deployProtocol(owner)

    nft = await deployUpgradeable('FakeNeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)
    await minter.setBoundaries(...boundaries)
  })

  it('must correctly accept proofs for minting', async () => {
    const signers = await ethers.getSigners()
    const [, , account2] = signers

    // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //                         First Mint Soulbound NFT to Unlock Your Level
    // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    const boundTokenId = 1001

    const ppm = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000)

    const amounts = [helper.ether(20_000), helper.ether(50_000)]
    await contracts.cxToken.mint(account2.address, amounts[0])
    await ppm.connect(account2).mint(contracts.cxToken.address, boundTokenId)

    // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //                      Mint Higher Level NFTs with Your Soulbound Token Id
    // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    const leaves = getDemoLeaves(signers)
    const tree = generateTree(leaves)
    const root = tree.getHexRoot()

    await minter.setMerkleRoot(root)

    const [, , leaf] = getDemoLeavesRaw(signers)
    const proof = tree.getHexProof(parseLeaf(leaf))

    const [account, level, family, persona] = leaf
    const familyFormatted = ethers.utils.formatBytes32String(family)
    const tokenId = boundaries[2].find(x => x.family === familyFormatted && x.level === level).min

    await minter.connect(account).setMyPersona([persona, persona, persona])
    await minter.connect(account).mint(proof, boundTokenId, level, familyFormatted, persona, tokenId)

    await minter.connect(account).mint(proof, boundTokenId, level, familyFormatted, persona, tokenId + 1)
      .should.be.rejectedWith('TokenAlreadyClaimedError')
  })
})
