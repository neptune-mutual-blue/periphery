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
}
