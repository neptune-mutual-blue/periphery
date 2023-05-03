// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface IVoteEscrowToken is IERC20 {
  function lock(uint256 amount, uint256 durationInWeeks) external;
  function unlock() external;
  function unlockPrematurely() external;

  function getLockedTokenBalance(address account) external view returns (uint256);
  function getUnlockTimestamp(address account) external view returns (uint256);
  function getMinUnlockHeight(address account) external view returns (uint256);

  function calculateBoost(uint256 expiryDuration) external pure returns (uint256);
  function getVotingPower(address account) external view returns (uint256);

  event VoteEscrowTokenConstructed(address store, address npmToken, address feeToAccount, string tokenName, string tokenSymbol);
  event VoteEscrowUnlock(address indexed accocunt, uint256 amount, uint256 unlockAt, uint256 penalty);
  event VoteEscrowLock(address indexed accocunt, uint256 amount, uint256 durationInWeeks, uint256 previousUnlockAt, uint256 unlockAt, uint256 previousBalance, uint256 balance);
}
