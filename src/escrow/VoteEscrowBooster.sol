// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.12;

import "../dependencies/ABDKMath64x64.sol";

abstract contract VoteEscrowBooster {
  using ABDKMath64x64 for uint256;
  using ABDKMath64x64 for int128;

  function _denominator() internal pure returns (uint256) {
    return 10_000;
  }

  function _calculateBoost(uint256 duration) internal pure returns (uint256) {
    uint256 boostFloor = 10_000;
    uint256 boostCeiling = 40_000;

    if (duration > 1456 days) {
      return boostCeiling;
    }

    uint256 result = duration.divu(1 days).div(uint256(1456).fromUInt()).mul(boostCeiling.divu(_denominator()).log_2()).exp_2().mulu(_denominator());

    if (result < boostFloor) {
      return boostFloor;
    }

    if (result > boostCeiling) {
      return boostCeiling;
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
