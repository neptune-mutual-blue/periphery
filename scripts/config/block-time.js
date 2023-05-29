const { networks } = require('./networks')

const SECONDS = 1
const MINUTES = 60 * SECONDS
const HOURS = 60 * MINUTES
const DAYS = 24 * HOURS
const WEEKS = 7 * DAYS
const EPOCH = 4 * WEEKS

const time = { SECONDS, MINUTES, HOURS, DAYS, WEEKS, EPOCH }

const averageBlockTime = {
  [networks.HardHat]: 0.25,
  [networks.Ethereum]: 12,
  [networks.Arbitrum]: 0.25
}

const blocksPerEpoch = {
  [networks.HardHat]: Math.floor(EPOCH / averageBlockTime[networks.HardHat]),
  [networks.Ethereum]: Math.floor(EPOCH / averageBlockTime[networks.Ethereum]),
  [networks.Arbitrum]: Math.floor(EPOCH / averageBlockTime[networks.Arbitrum])
}

module.exports = { averageBlockTime, blocksPerEpoch, networks, time }
