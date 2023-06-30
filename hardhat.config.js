require('hardhat-contract-sizer')
require('hardhat-gas-reporter')
require('solidity-coverage')
require('@nomicfoundation/hardhat-verify')
require('@nomicfoundation/hardhat-chai-matchers')
require('@openzeppelin/hardhat-upgrades')

require('dotenv').config()

const GWEI = 1_000_000_000

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      blockGasLimit: 19_000_000
    },
    basegoerli: {
      url: 'https://goerli.base.org',
      chainId: 84531,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 0.1 * GWEI,
      explorer: 'https://goerli.basescan.org'
    },
    ethereum: {
      blockGasLimit: 19_000_000, // 19M
      url: process.env.ETHEREUM_RPC_URL,
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 50 * GWEI,
      explorer: 'https://etherscan.io'
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      chainId: 42161,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 0.1 * GWEI,
      explorer: 'https://arbiscan.io'
    },
    bsc: {
      url: process.env.BSC_RPC_URL,
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 3 * GWEI,
      explorer: 'https://bscscan.com'
    }
  },
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 999_999
      }
    }
  },
  mocha: {
    timeout: 20_000
  },
  gasReporter: {
    currency: 'ETH',
    gasPrice: 50
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: true,
    disambiguatePaths: false
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      basegoerli: 'base'
    },
    customChains: [
      {
        network: 'basegoerli',
        chainId: 84531,
        urls: {
          apiURL: 'https://api-goerli.basescan.org/api',
          browserURL: 'https://goerli.basescan.org'
        }
      }
    ]
  },
  paths: {
    tests: './specs',
    sources: './src'
  }
}

module.exports = config
