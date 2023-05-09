// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
// slither-disable-start constable-states
// slither-disable-start unused-state
// slither-disable-start uninitialized-state
pragma solidity ^0.8.12;

import "./interfaces/IGaugeControllerRegistry.sol";
import "../dependencies/interfaces/IStore.sol";

abstract contract GaugeControllerRegistryState is IGaugeControllerRegistry {
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Version 1
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  address public _operator;

  uint256 public _epoch;
  uint256 public _sumNpmDeposits;
  uint256 public _sumNpmWithdrawals;

  mapping(address => bool) public _pausers;
  mapping(bytes32 => bool) public _validPools;
  mapping(bytes32 => bool) public _activePools;
  mapping(bytes32 => uint256) public _emissionsPerBlock;
  mapping(uint256 => uint256) public _guageAllocations;

  IStore public _s;
  mapping(bytes32 => PoolSetupArgs) public _pools;
}
// slither-disable-end uninitialized-state
// slither-disable-end unused-state
// slither-disable-end constable-states
