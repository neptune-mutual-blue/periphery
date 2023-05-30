// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
// slither-disable-start constable-states
// slither-disable-start unused-state
// slither-disable-start uninitialized-state
pragma solidity ^0.8.12;

import "./interfaces/IGaugeControllerRegistry.sol";

abstract contract GaugeControllerRegistryState is IGaugeControllerRegistry {
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Version 1
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  bytes32 public constant NS_GAUGE_AGENT = "role:gauge:agent";
  bytes32 public constant NS_ROLES_PAUSER = "role:pauser";
  bytes32 public constant NS_ROLES_RECOVERY_AGENT = "role:recovery:agent";

  address public _operator;
  address public _rewardToken;

  uint256 public _epoch;
  uint256 public _blocksPerEpoch;
  uint256 public _sumNpmDeposits;
  uint256 public _sumNpmWithdrawals;

  mapping(bytes32 => bool) public _validPools;
  mapping(bytes32 => bool) public _activePools;
  mapping(bytes32 => uint256) public _emissionsPerBlock;
  mapping(uint256 => uint256) public _gaugeAllocations;

  mapping(bytes32 => PoolSetupArgs) public _pools;
  mapping(uint256 => Epoch) public _epochs;
}
// slither-disable-end uninitialized-state
// slither-disable-end unused-state
// slither-disable-end constable-states
