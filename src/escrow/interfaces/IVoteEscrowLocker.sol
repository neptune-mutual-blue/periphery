// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

interface IVoteEscrowLocker {
  event VoteEscrowLock(address indexed accocunt, uint256 amount, uint256 durationInWeeks, uint256 previousUnlockAt, uint256 unlockAt, uint256 previousBalance, uint256 balance);
  event VoteEscrowUnlock(address indexed accocunt, uint256 amount, uint256 unlockAt, uint256 penalty);
}
