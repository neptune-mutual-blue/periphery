// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: Apache-2.0
// slither-disable-start constable-states
// slither-disable-start unused-state
// slither-disable-start uninitialized-state
pragma solidity ^0.8.12;

abstract contract VoteEscrowTokenState {
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Version 1
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  address public _underlyingToken;
  address public _feeTo;
  uint256 public _totalLocked;
  mapping(address => bool) public _whitelist;
  mapping(address => bool) public _pausers;

  mapping(address => uint256) public _balances;
  mapping(address => uint256) public _unlockAt;
  mapping(address => uint256) public _minUnlockHeights;
}

// slither-disable-end uninitialized-state
// slither-disable-end unused-state
// slither-disable-end constable-states
