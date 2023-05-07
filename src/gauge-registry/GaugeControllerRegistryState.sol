// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
// slither-disable
pragma solidity ^0.8.12;

import "./interfaces/IGaugeControllerRegistry.sol";
import "../dependencies/interfaces/IStore.sol";

abstract contract GaugeControllerRegistryState is IGaugeControllerRegistry {
  // slither-disable-start constable-states
  // slither-disable-start unused-state

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                        Primitive Types
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  address public _operator;
  address[49] public __address_gap;

  // bool[50] public __bool_gap;
  // bytes32[50] public __bytes32_gap;
  // string[50] public __string_gap;

  uint256 public _epoch;
  uint256 public _sumNpmDeposits;
  uint256 public _sumNpmWithdrawals;
  uint256[47] public __uint256_gap;

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Mappings
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  mapping(address => bool) public _pausers;
  mapping(address => bool)[49] __address_bool_mapping_gap;

  mapping(bytes32 => bool) public _validPools;
  mapping(bytes32 => bool) public _activePools;
  mapping(bytes32 => bool)[48] __bytes32_bool_mapping_gap;

  mapping(bytes32 => uint256) public _emissionsPerBlock;
  mapping(bytes32 => uint256)[49] __bytes32_uint256_mapping_gap;

  mapping(uint256 => uint256) public _guageAllocations;
  mapping(uint256 => uint256)[49] __uint256_uint256_mapping_gap;

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Custom Types
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  IStore public _s;
  mapping(bytes32 => PoolSetupArgs) public _pools;

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                        Others/Unplanned
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // slither-disable-end unused-state
  // slither-disable-end constable-states
}
