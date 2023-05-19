// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

abstract contract LiquidityGaugePoolState {
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Version 1
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  address public _veToken;
  address public _registry;
  address public _treasury;
  address public _rewardToken;

  uint256 public _totalVotingPower;

  mapping(address => uint256) public _myVotingPower;

  mapping(bytes32 => uint256) public _poolStakedByEveryone;

  mapping(bytes32 => mapping(address => uint256)) public _poolLastRewardHeights;
  mapping(bytes32 => mapping(address => uint256)) public _poolStakedByMe;
  mapping(bytes32 => mapping(address => uint256)) public _canWithdrawFrom;
}
