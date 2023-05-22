const { ethers } = require('hardhat')
const { boundaries } = require('../../util/boundaries')
const { generateTree, parseLeaf } = require('../../util/tree')
const { deployUpgradeable } = require('../../util/factory')
const { getDemoLeaves, getDemoLeavesRaw } = require('../../util/demo-leaves')

describe('Merkle Proof Validation', () => {
  let minter, nft

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('FakeNeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)
    await minter.setBoundaries(...boundaries)
  })

  it('must correctly accept proofs for minting', async () => {
    const signers = await ethers.getSigners()

    const leaves = getDemoLeaves(signers)
    const tree = generateTree(leaves)
    const root = tree.getHexRoot()

    await minter.setMerkleRoot(root)

    console.log('-'.repeat(50))

    const [, , leaf] = getDemoLeavesRaw(signers)
    const proof = tree.getHexProof(parseLeaf(leaf))

    const [account, level, family, persona] = leaf
    const familyFormatted = ethers.utils.formatBytes32String(family)
    const tokenId = boundaries[2].find(x => x.family === familyFormatted && x.level === level).min

    await minter.connect(account).setMyPersona(level, persona)
    await minter.connect(account).mint(proof, level, familyFormatted, persona, tokenId)

    await minter.connect(account).mint(proof, level, familyFormatted, persona, tokenId + 1)
      .should.be.rejectedWith('TokenAlreadyClaimedError')
  })
})
