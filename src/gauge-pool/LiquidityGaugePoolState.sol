// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "../dependencies/interfaces/IStore.sol";

abstract contract LiquidityGaugePoolState {
  // slither-disable-start constable-states
  // slither-disable-start unused-state

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                        Primitive Types
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  address public _veNpm;
  address public _npm;
  address public _registry;
  address public _treasury;
  address[46] public __address_gap;

  // bool[50] public __bool_gap;
  // bytes32[50] public __bytes32_gap;
  // string[50] public __string_gap;

  uint256 public _totalVotingPower;
  uint256[49] public __uint256_gap;

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Mappings
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  mapping(address => uint256) public _myVotingPower;
  mapping(address => uint256)[49] __address_uint256_mapping_gap;

  mapping(bytes32 => uint256) public _poolStakedByEveryone;
  mapping(bytes32 => uint256)[49] __bytes32_uint256_mapping_gap;

  mapping(bytes32 => mapping(address => uint256)) public _poolLastRewardHeights;
  mapping(bytes32 => mapping(address => uint256)) public _poolStakedByMe;
  mapping(bytes32 => mapping(address => uint256)) public _canWithdrawFrom;
  mapping(bytes32 => mapping(address => uint256))[47] __bytes32_address_uint256_mapping_gap;

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Custom Types
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  IStore public _s;

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                        Others/Unplanned
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  // slither-disable-end unused-state
  // slither-disable-end constable-states
}
