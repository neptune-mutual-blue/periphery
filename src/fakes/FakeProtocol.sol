// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../dependencies/interfaces/IStore.sol";
import "../dependencies/interfaces/IProtocol.sol";

contract FakeProtocol is IProtocol, AccessControlUpgradeable, PausableUpgradeable {
  bool public initialized;
  IStore public s;

  function initialize(IStore store) public initializer {
    s = store;
  }

  function addMember(address member) external override {}

  function removeMember(address member) external override {}

  function addContract(bytes32 namespace, address contractAddress) external override {}

  function addContracts(bytes32[] calldata namespaces, bytes32[] calldata keys, address[] calldata contractAddresses) external override {}

  function addContractWithKey(bytes32 namespace, bytes32 key, address contractAddress) public override {}

  function upgradeContract(bytes32 namespace, address previous, address current) external override {}

  function upgradeContractWithKey(bytes32 namespace, bytes32 key, address previous, address current) public override {}

  function grantRoles(AccountWithRoles[] calldata detail) external override {}

  function grantRole(bytes32 role, address account) public override(AccessControlUpgradeable, IAccessControlUpgradeable) {
    super.grantRole(role, account);
  }

  function revokeRole(bytes32 role, address account) public override(AccessControlUpgradeable, IAccessControlUpgradeable) {
    super.revokeRole(role, account);
  }

  function renounceRole(bytes32 role, address account) public override(AccessControlUpgradeable, IAccessControlUpgradeable) {
    super.renounceRole(role, account);
  }

  function version() external pure override returns (bytes32) {
    return "v0.1";
  }

  function getName() external pure override returns (bytes32) {
    return "Fake Protocol";
  }
}
