// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

abstract contract TokenState {
  bytes32 public constant NS_ROLES_MINTER = "role:minter";
  bytes32 public constant NS_ROLES_PAUSER = "role:pauser";
  bytes32 public constant NS_ROLES_RECOVERY_AGENT = "role:recovery:agent";
}
