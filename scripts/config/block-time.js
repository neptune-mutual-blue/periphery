const { networks } = require('./networks')

const SECONDS = 1
const MINUTES = 60 * SECONDS
const HOURS = 60 * MINUTES
const DAYS = 24 * HOURS
const WEEKS = 7 * DAYS
const EPOCH = 4 * WEEKS

const time = { SECONDS, MINUTES, HOURS, DAYS, WEEKS, EPOCH }

module.exports = { networks, time }
