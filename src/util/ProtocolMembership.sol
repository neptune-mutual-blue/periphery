// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../dependencies/interfaces/IStore.sol";
import "./interfaces/IPausable.sol";
import "openzeppelin-solidity/contracts/access/IAccessControl.sol";

abstract contract ProtocolMembership {
  IStore public globalStorage; // Protocol store

  bytes32 public constant _NS_MEMBERS = "ns:members";
  bytes32 public constant _CNS_CORE = "cns:core";

  constructor(IStore store) {
    globalStorage = store;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                       Internal Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function getProtocolAddress() internal view returns (address) {
    return globalStorage.getAddress(_CNS_CORE);
  }

  function hasAccess(bytes32 role, address user) public view returns (bool) {
    address protocol = getProtocolAddress();

    // The protocol is not deployed yet. Therefore, no role to check
    if (protocol == address(0)) {
      return false;
    }

    return IAccessControl(protocol).hasRole(role, user);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Validations
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _throwIfNotProtocolMember(address account) internal view {
    require(address(globalStorage) != address(0), "Error: invalid store");

    bytes32 key = keccak256(abi.encodePacked(_NS_MEMBERS, account));
    bool isMember = globalStorage.getBool(key);

    require(isMember == true, "Access denied");
  }

  function _throwIfProtocolPaused() internal view {
    IPausable protocol = IPausable(getProtocolAddress());
    require(protocol.paused() == false, "Error: paused");
  }

  function _throwIfWithoutRole(bytes32 role, address caller) private view {
    require(hasAccess(role, caller), "Forbidden");
  }
}
