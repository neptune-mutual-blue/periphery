// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "../../dependencies/interfaces/IStore.sol";
import "../../nft/interfaces/INeptuneLegends.sol";
import "./interfaces/IMerkleProofMinter.sol";

abstract contract MerkleProofMinterState is IMerkleProofMinter {
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Version 1
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  bytes32 public constant NS_ROLES_PAUSER = "pauser";
  bytes32 public constant NS_ROLES_PROOF_AGENT = "proof:agent";
  bytes32 public constant NS_ROLES_RECOVERY_AGENT = "recovery:agent";

  IStore public _s;
  INeptuneLegends public _nft;

  bytes32 public _merkleRoot;

  mapping(uint256 => address) public souls;

  // account --> level --> persona
  mapping(address => mapping(uint8 => uint8)) public _personas;

  // account --> level -- minted flag
  mapping(address => mapping(uint8 => bool)) public _mintStatus;
  mapping(uint256 => mapping(bytes32 => Boundary)) public _boundaries;
}
