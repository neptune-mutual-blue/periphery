// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../../escrow/interfaces/IVoteEscrowToken.sol";

interface ILiquidityGaugePool {
  struct PoolInfo {
    bytes32 key;
    string name;
    bytes32 info;
    uint256 lockupPeriodInBlocks;
    uint256 epochDuration;
    uint256 veBoostRatio;
    uint256 platformFee;
    IERC20Upgradeable stakingToken;
    IVoteEscrowToken veToken;
    IERC20Upgradeable rewardToken;
    address registry;
    address treasury;
  }

  event EpochRewardSet(address indexed triggeredBy, uint256 reward);
  event LiquidityGaugePoolDeposited(address indexed account, uint256 amount);
  event LiquidityGaugePoolWithdrawn(address indexed user, uint256 amount);
  event LiquidityGaugePoolRewardsWithdrawn(address indexed user, uint256 reward, uint256 platformFee);
  event EpochDurationUpdated(uint256 previous, uint256 current);
  event VotingPowersUpdated(address indexed triggeredBy, uint256 previous, uint256 current, uint256 previousTotal, uint256 currentTotal);
  event LiquidityGaugePoolSet(address indexed triggeredBy, PoolInfo args);

  function deposit(uint256 amount) external;
  function withdraw(uint256 amount) external;
  function withdrawRewards() external;
  function exit() external;

  function setPool(PoolInfo calldata args) external;
  function setEpoch(uint256 epoch, uint256 epochDuration, uint256 reward) external;
  function getKey() external view returns (bytes32);

  error WithdrawalLockedError(uint256 waitUntilHeight);
  error EpochUnavailableError();
  error EpochStillActiveError(uint256 endsAt);
  error PlatformFeeTooHighError(uint256 platformFee);
}
