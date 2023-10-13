// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "./interfaces/ILiquidityGaugePool.sol";

abstract contract LiquidityGaugePoolState is ILiquidityGaugePool {
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Version 1
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  uint256 public constant _LOCKUP_PERIOD_IN_BLOCKS = 100;
  uint256 public constant _MAX_PLATFORM_FEE = 2000;
  bytes32 public constant _NS_ROLES_PAUSER = "role:pauser";
  bytes32 public constant _NS_ROLES_RECOVERY_AGENT = "role:recovery:agent";

  uint256 public _epoch;
  uint256 public _epochEndTimestamp;
  uint256 public _lastRewardTimestamp;
  uint256 public _lockedByEveryone;
  uint256 public _rewardAllocation;
  uint256 public _rewardPerSecond;
  uint256 public _rewardPerTokenUnit;
  uint256 public _totalVotingPower;

  bytes32 public _key;
  address public _registry;
  address public _rewardToken;
  address public _stakingToken;
  address public _veToken;

  PoolInfo public _poolInfo;

  mapping(address => uint256) public _lastDepositHeights;
  mapping(address => uint256) public _lastRewardPerTokenUnit;
  mapping(address => uint256) public _lockedByMe;
  mapping(address => uint256) public _myVotingPower;
  mapping(address => uint256) public _pendingRewardToDistribute;
  uint256[50] __gap;
}
