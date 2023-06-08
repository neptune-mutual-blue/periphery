// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "../../gauge-registry/interfaces/IGaugeControllerRegistry.sol";

interface ILiquidityGaugePool {
  function setAddresses(address veToken, address rewardToken, address registry, address treasury) external;
  function deposit(bytes32 key, uint256 amount) external;
  function withdraw(bytes32 key, uint256 amount) external;
  function withdrawRewards(bytes32 key) external returns (IGaugeControllerRegistry.PoolSetupArgs memory);

  function calculateReward(bytes32 key, address account) external view returns (uint256);
  function getTotalBlocksSinceLastReward(bytes32 key, address account) external view returns (uint256);

  event VotingPowersUpdated(address indexed triggeredBy, uint256 previous, uint256 current, uint256 previousTotal, uint256 currentTotal);
  event LiquidityGaugeRewardsWithdrawn(bytes32 indexed key, address indexed account, address treasury, uint256 rewards, uint256 platformFee);
  event LiquidityGaugeDeposited(bytes32 indexed key, address indexed account, address indexed stakingToken, uint256 amount);
  event LiquidityGaugeWithdrawn(bytes32 indexed key, address indexed account, address indexed stakingToken, uint256 amount);
  event LiquidityGaugePoolInitialized(address previousVeToken, address veToken, address previousRegistry, address registry, address previousTreasury, address treasury);

  error PoolNotFoundError(bytes32 key);
  error PoolNotActiveError(bytes32 key);
  error WithdrawalLockedError(uint256 waitUntil);
  error PlatformFeeTooHighError(bytes32 key, uint256 platformFee);
}
