// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "../dependencies/ABDKMath64x64.sol";

abstract contract VoteEscrowBooster {
  using ABDKMath64x64 for uint256;
  using ABDKMath64x64 for int128;

  function _denominator() internal pure returns (uint256) {
    return 10_000;
  }

  function _calculateBoost(uint256 expiryDuration) internal pure returns (uint256) {
    uint256 _BOOST_FLOOR = 10_000;
    uint256 _BOOST_CEILING = 40_000;

    if (expiryDuration > 1460 days) {
      return _BOOST_CEILING;
    }

    uint256 result = expiryDuration.divu(1 days).div(uint256(1460).fromUInt()).mul(_BOOST_CEILING.divu(_denominator()).log_2()).exp_2().mulu(_denominator());

    if (result < _BOOST_FLOOR) {
      return _BOOST_FLOOR;
    }

    if (result > _BOOST_CEILING) {
      return _BOOST_CEILING;
    }

    return result;
  }

  function _getVotingPower(uint256 balance, uint256 unlockDate, uint256 currentTimestamp) internal pure returns (uint256) {
    if (unlockDate <= currentTimestamp) {
      return 0;
    }

    return (balance * _calculateBoost(unlockDate - currentTimestamp)) / _denominator();
  }
}
