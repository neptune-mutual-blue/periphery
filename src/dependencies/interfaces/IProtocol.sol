// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "./IMember.sol";

interface IProtocol is IMember, IAccessControlUpgradeable {
  struct AccountWithRoles {
    address account;
    bytes32[] roles;
  }

  event ContractAdded(bytes32 indexed namespace, bytes32 indexed key, address indexed contractAddress);
  event ContractUpgraded(bytes32 indexed namespace, bytes32 indexed key, address previous, address indexed current);
  event MemberAdded(address member);
  event MemberRemoved(address member);

  function addContract(bytes32 namespace, address contractAddress) external;

  function addContracts(bytes32[] calldata namespaces, bytes32[] calldata keys, address[] calldata contractAddresses) external;

  function addContractWithKey(bytes32 namespace, bytes32 coverKey, address contractAddress) external;

  function upgradeContract(bytes32 namespace, address previous, address current) external;

  function upgradeContractWithKey(bytes32 namespace, bytes32 coverKey, address previous, address current) external;

  function addMember(address member) external;

  function removeMember(address member) external;

  function grantRoles(AccountWithRoles[] calldata detail) external;
}
