// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/access/AccessControl.sol";
import "openzeppelin-solidity/contracts/security/Pausable.sol";
import "../dependencies/interfaces/IStore.sol";
import "../dependencies/interfaces/IProtocol.sol";

contract FakeProtocol is IProtocol, AccessControl, Pausable {
  bool public initialized = false;
  IStore public s;

  constructor(IStore store) {
    s = store;
  }

  function initialize(InitializeArgs calldata args) external override {}

  function addMember(address member) external override {}

  function removeMember(address member) external override {}

  function addContract(bytes32 namespace, address contractAddress) external override {}

  function addContracts(bytes32[] calldata namespaces, bytes32[] calldata keys, address[] calldata contractAddresses) external override {}

  function addContractWithKey(bytes32 namespace, bytes32 key, address contractAddress) public override {}

  function upgradeContract(bytes32 namespace, address previous, address current) external override {}

  function upgradeContractWithKey(bytes32 namespace, bytes32 key, address previous, address current) public override {}

  function grantRoles(AccountWithRoles[] calldata detail) external override {}

  function grantRole(bytes32 role, address account) public override(AccessControl, IAccessControl) {
    super.grantRole(role, account);
  }

  function revokeRole(bytes32 role, address account) public override(AccessControl, IAccessControl) {
    super.revokeRole(role, account);
  }

  function renounceRole(bytes32 role, address account) public override(AccessControl, IAccessControl) {
    super.renounceRole(role, account);
  }

  function version() external pure override returns (bytes32) {
    return "v0.1";
  }

  function getName() external pure override returns (bytes32) {
    return "Fake Protocol";
  }
}
