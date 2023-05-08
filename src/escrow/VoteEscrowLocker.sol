// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.12;

import "./interfaces/IVoteEscrowLocker.sol";
import "../util/interfaces/IThrowable.sol";
import "./VoteEscrowTokenState.sol";

abstract contract VoteEscrowLocker is IThrowable, IVoteEscrowLocker, VoteEscrowTokenState {
  function _lock(address account, uint256 amount, uint256 durationInWeeks) internal {
    if (_balances[account] == 0 && amount == 0) {
      // You need existing balance before you can extend the vote lock period
      revert ZeroAmountError("amount");
    }

    uint256 _MIN_LOCK_HEIGHT = 10;
    uint256 newUnlockTimestamp = block.timestamp + (durationInWeeks * 7 days);

    if (durationInWeeks < 4 || durationInWeeks > 208) {
      revert InvalidVoteLockPeriodError(4, 208);
    }

    if (newUnlockTimestamp < _unlockAt[account]) {
      // Can't decrease the lockup period
      revert InvalidVoteLockExtensionError(_unlockAt[account], newUnlockTimestamp);
    }

    uint256 previousBalance = _balances[account];

    emit VoteEscrowLock(account, amount, durationInWeeks, _unlockAt[account], newUnlockTimestamp, previousBalance, _balances[account]);

    _balances[account] += amount;
    _totalLocked += amount;
    _unlockAt[account] = newUnlockTimestamp;
    _minUnlockHeights[account] = block.number + _MIN_LOCK_HEIGHT;
  }

  function _unlock(address account, uint256 penalty) internal returns (uint256 amount) {
    amount = _balances[account];

    uint256 unlockAt = _unlockAt[account];

    if (amount == 0) {
      revert ZeroAmountError("balance");
    }

    _unlockAt[account] = 0;
    _balances[account] = 0;
    _totalLocked -= amount;

    emit VoteEscrowUnlock(account, amount, unlockAt, penalty);
  }
}
