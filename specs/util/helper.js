const ethers = require('ethers')
const crypto = require('crypto')

const MULTIPLIER = 10_000
const STABLECOIN_DECIMALS = 6

const randomPrivateKey = () => `0x${crypto.randomBytes(32).toString('hex')}`
const randomAddress = () => new ethers.Wallet(randomPrivateKey()).address
const ether = (x, decimals = 18) => BigInt(parseFloat(x) * 100) / BigInt(100) * BigInt(Math.pow(10, decimals))
const percentage = (x) => BigInt((parseFloat(x) * MULTIPLIER)) / BigInt(100)
const weiToEther = (x, decimals = 18) => parseInt(x.toString()) / Math.pow(10, decimals)
const toPercentageString = (x) => (100 * parseInt(x.toString()) / MULTIPLIER).toFixed(2)
const zerox = '0x0000000000000000000000000000000000000000'
const zero1 = '0x0000000000000000000000000000000000000001'
const emptyBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000'
const sum = (x) => x.reduce((y, z) => y + z)
const getRandomNumber = (min, max) => Math.ceil(Math.floor(Math.random() * (max - min + 1)) + min)
const formatToken = (x, symbol) => Number(x).toLocaleString('en-US', { minimumFractionDigits: 4 }) + (` ${symbol}` || '')
const weiAsToken = (x, symbol, decimals = 18) => formatToken(weiToEther(x, decimals), symbol)
const formatCurrency = (x, precision = 4) => Number(x).toLocaleString(undefined, { currency: 'USD', style: 'currency', minimumFractionDigits: precision })
const stringToHex = (x) => '0x' + Array.from(x).map(c => c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16) : encodeURIComponent(c).replace(/%/g, '').toLowerCase()).join('')

const formatPercent = (x) => {
  if (!x || isNaN(x)) {
    return ''
  }

  const percent = parseFloat(x) * 100

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: percent < 1 ? 6 : 2
  }).format(x)
}

const formatPercentSolidity = (x) => {
  return formatPercent(x.toNumber() / MULTIPLIER) + ' (Solidity)'
}

module.exports = {
  randomAddress,
  randomPrivateKey,
  ether,
  percentage,
  weiToEther,
  toPercentageString,
  zerox,
  zero1,
  emptyBytes32,
  sum,
  getRandomNumber,
  weiAsToken,
  formatCurrency,
  formatPercent,
  formatPercentSolidity,
  stringToHex,
  MULTIPLIER,
  STABLECOIN_DECIMALS
}
