// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "../dependencies/interfaces/IStore.sol";

abstract contract VoteEscrowTokenState {
  // slither-disable-start constable-states
  // slither-disable-start unused-state

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                        Primitive Types
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  address public _feeTo;
  address[48] public __address_gap;

  // bool[50] public __bool_gap;
  // bytes32[50] public __bytes32_gap;
  // string[50] public __string_gap;

  uint256 public _totalLocked;
  uint256[49] public __uint256_gap;

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Mappings
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  mapping(address => bool) public _whitelist;
  mapping(address => bool) public _pausers;
  mapping(address => bool)[48] __address_bool_mapping_gap;

  mapping(address => uint256) public _balances;
  // slither-disable-next-line uninitialized-local
  mapping(address => uint256) public _unlockAt;
  // slither-disable-next-line uninitialized-local
  mapping(address => uint256) public _minUnlockHeights;
  mapping(address => uint256)[47] __address_uint256_mapping_gap;

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
