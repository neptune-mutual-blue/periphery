const { ethers } = require('hardhat')
const { boundaries } = require('../../util/boundaries')
const { generateTree, parseLeaf } = require('../../util/tree')
const { deployUpgradeable, deployProtocol } = require('../../util/factory')
const { getDemoLeaves, getDemoLeavesRaw } = require('../../util/demo-leaves')
const helper = require('../../util/helper')
const key = require('../../util/key')

describe('Merkle Proof Minter: Validate Proof', () => {
  let minter, nft, contracts

  before(async () => {
    const [owner] = await ethers.getSigners()
    contracts = await deployProtocol(owner)

    nft = await deployUpgradeable('NeptuneLegends', 'https://neptunemutual.com', owner.address, owner.address)
    minter = await deployUpgradeable('MerkleProofMinter', nft.address, contracts.npm.address, owner.address, owner.address)

    await minter.grantRole(ethers.utils.formatBytes32String('proof:agent'), owner.address)
    await minter.setBoundaries(...boundaries)

    await nft.grantRole(key.ACCESS_CONTROL.ROLE_MINTER, minter.address)
  })

  it('must revert when proof is invalid', async () => {
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

    const leaf = rawLeaves[0]

    const proof = tree.getHexProof(parseLeaf(leaf))
    const [account, level, family, persona] = leaf
    const familyFormatted = ethers.utils.formatBytes32String(family)

    await minter.connect(account).validateProof(proof, level, familyFormatted, persona === 0 ? 1 : 0)
      .should.be.rejectedWith('InvalidProofError')
  })
})
