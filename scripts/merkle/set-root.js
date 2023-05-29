const { formatEther } = require('ethers/lib/utils')
const { ethers, network } = require('hardhat')
const factory = require('../../specs/util/factory')
const deployments = require('../util/deployments')
const { MerkleTree } = require('merkletreejs')
const { utils } = require('ethers')

const merkleLeaves = require('./merkle-leaves.json')

const getDependencies = async (deployer, chainId) => {
  if (chainId !== 31337) {
    return deployments.get(chainId)
  }

  const neptuneLegends = await factory.deployUpgradeable('NeptuneLegends', 'https://nft.neptunemutual.net/metadata/', deployer.address, deployer.address)
  const merkleProofMinter = await factory.deployUpgradeable('MerkleProofMinter', neptuneLegends.address, deployer.address, deployer.address)

  return { neptuneLegends: neptuneLegends.address, merkleProofMinter: merkleProofMinter.address }
}

const parseLeaf = (x) => utils.keccak256(utils.solidityPack(
  ['address', 'uint8', 'bytes32', 'uint8'],
  [x.account, x.level, utils.formatBytes32String(x.family), x.persona])
)

const generateTree = (leaves) => {
  return new MerkleTree(leaves, utils.keccak256, { sortPairs: true })
}

const deploy = async () => {
  const [deployer] = await ethers.getSigners()
  const previousBalance = await deployer.getBalance()

  console.log('Deployer: %s Balance: %d ETH', deployer.address, formatEther(previousBalance))

  const { chainId } = network.config
  const { merkleProofMinter } = await getDependencies(deployer, chainId)

  const minter = await factory.attach(deployer, merkleProofMinter, 'MerkleProofMinter')

  const eligible = merkleLeaves.filter(x => !!x.family)

  const leaves = eligible.map(parseLeaf)
  const tree = generateTree(leaves)
  const root = tree.getHexRoot()

  const tx = await minter.setMerkleRoot(root)
  console.log('Merkle Root Set', tx.hash)
}

deploy().catch(console.error)
