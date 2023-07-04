const { ethers } = require('hardhat')
const helper = require('../../util/helper')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const key = require('../../util/key')
const { getDemoLeaves, getDemoLeavesRaw } = require('../../util/demo-leaves')
const { generateTree, parseLeaf } = require('../../util/tree')
const { boundaries } = require('../../util/boundaries')

describe('Merkle Proof Minter: Mint (Paused)', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    contracts = await deployProtocol(owner)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)
    await minter.setBoundaries(...boundaries)

    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)

    await minter.grantRole(ethers.utils.formatBytes32String('pauser'), owner.address)
  })

  it('must not be able to mint when contract is paused.', async () => {
    const signers = await ethers.getSigners()
    let lastBoundTokenId = 1000

    const ppm = await deployUpgradeable('PolicyProofMinter', contracts.store.address, nft.address, 1, 10000, signers[0].address)
    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, ppm.address)

    const leaves = getDemoLeaves(signers)
    const tree = generateTree(leaves)
    const root = tree.getHexRoot()
    await minter.setMerkleRoot(root)

    const rawLeaves = getDemoLeavesRaw(signers)
    const candidates = {}
    const boundTokens = {}
    const mintedTokens = {}

    for (const [account, level, , persona] of rawLeaves) {
      candidates[account.address] = candidates[account.address] || {
        account: account,
        personas: {}
      }

      candidates[account.address].personas[level] = persona
    }

    for (const key in candidates) {
      const candidate = candidates[key]
      const personas = Object.values(candidate.personas)
        .concat([...Array(7)].fill(1))
        .filter((_, index) => index % 2 === 0)
        .slice(0, 3)

      await minter.connect(candidate.account).setMyPersona(personas)
      lastBoundTokenId++

      if (!boundTokens[key]) {
        await contracts.npm.mint(key, helper.ether(1000))

        await contracts.cxToken.mint(candidate.account.address, helper.ether(1))
        await ppm.connect(candidate.account).mint(contracts.cxToken.address, lastBoundTokenId)
        boundTokens[key] = lastBoundTokenId
      }
    }

    await minter.connect(signers[1]).pause().should.be.rejectedWith('AccessControl')

    await minter.pause()

    for (const leaf of rawLeaves) {
      const proof = tree.getHexProof(parseLeaf(leaf))
      const [account, level, family, persona] = leaf
      const familyFormatted = ethers.utils.formatBytes32String(family)
      const boundary = boundaries[2].find(item => item.family === familyFormatted && item.level === level)

      if (!mintedTokens[level + family]) {
        mintedTokens[level + family] = boundary.min
      }

      mintedTokens[level + family] += 1
      const tokenId = mintedTokens[level + family]

      await minter.connect(account).mint(proof, boundTokens[account.address], level, familyFormatted, persona, tokenId)
        .should.be.rejectedWith('Pausable: paused')
    }
  })

  it('can only be unpaused by admin', async () => {
    const [, account] = await ethers.getSigners()
    await minter.connect(account).unpause().should.be.rejectedWith('AccessControl')

    await minter.unpause()
  })
})
