/*
File: calculate-boost.js
Author: Neptune Mutual
Description: This file contains a JavaScript implementation of the Solidity function "calculateBoost".
License: Apache 2.0
*/
const _ONE_DAY = 86400
const _DENOMINATOR = 10_000

/**
* Calculates the boost based on the lock duration
* @param {number} lockDuration - the lock duration in seconds
* @returns {number} - the calculated boost
*/
const calculateBoost = (lockDuration) => {
  const _BOOST_FLOOR = 10_000
  const _BOOST_CEILING = 40_000

  if (lockDuration > 1456 * _ONE_DAY) {
    return _BOOST_CEILING
  }

  // Solidity
  // ---------
  // uint256 result = lockDuration.divu(1 days)
  // .div(uint256(1456).fromUInt())
  // .mul(_BOOST_CEILING.divu(_denominator()).log_2())
  // .exp_2()
  // .mulu(_denominator());

  const result = 2 ** ((lockDuration / (_ONE_DAY * 1456)) * Math.log2(_BOOST_CEILING / _DENOMINATOR)) * _DENOMINATOR

  if (result < _BOOST_FLOOR) {
    return _BOOST_FLOOR
  }

  if (result > _BOOST_CEILING) {
    return _BOOST_CEILING
  }

  return result
}

const getVotingPower = (balance, lockDuration) => {
  const boost = Math.floor(calculateBoost(lockDuration))
  return (BigInt(balance) * BigInt(boost)) / BigInt(_DENOMINATOR)
}

if (typeof module !== 'undefined') {
  module.exports = { calculateBoost, getVotingPower }
}
