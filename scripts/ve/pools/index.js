const baseGoerli = require('./base-goerli.json')

const networks = {
  HARDHAT: 31337,
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE_GOERLI: 84531,
  FUJI: 43113
}

const pools = {
  [networks.HARDHAT]: baseGoerli,
  [networks.BASE_GOERLI]: baseGoerli,
  [networks.FUJI]: null,
  [networks.ETHEREUM]: null,
  [networks.ARBITRUM]: null
}

module.exports = { pools }
