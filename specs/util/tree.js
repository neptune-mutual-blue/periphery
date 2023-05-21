const { MerkleTree } = require('merkletreejs')
const { utils } = require('ethers')

const parseLeaf = (candidates) => {
  const [account, level, family, persona] = candidates

  return utils.keccak256(utils.solidityPack(['address', 'uint8', 'bytes32', 'uint8'], [account.address, level, utils.formatBytes32String(family), persona]))
}

const generateTree = (leaves) => {
  return new MerkleTree(leaves, utils.keccak256, { sortPairs: true })
}

module.exports = { generateTree, parseLeaf }
