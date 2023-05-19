// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "../dependencies/interfaces/IStore.sol";
import "./interfaces/IPausable.sol";
import "./interfaces/IThrowable.sol";

abstract contract ProtocolMembership is IThrowable {
  function getProtocolAddress(IStore s) internal view returns (address) {
    bytes32 CNS_CORE = "cns:core";
    return s.getAddress(CNS_CORE);
  }

  function _getNpm(IStore s) internal view returns (address) {
    bytes32 CNS_NPM = "cns:core:npm:instance";
    return s.getAddress(CNS_NPM);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Validations
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _throwIfNotProtocolMember(IStore s, address account) internal view {
    if (address(s) == address(0)) {
      revert ProtocolStoreNotFoundError();
    }

    bytes32 NS_MEMBERS = "ns:members";

    bytes32 key = keccak256(abi.encodePacked(NS_MEMBERS, account));
    bool isMember = s.getBool(key);

    if (isMember == false) {
      revert AccessDeniedError("ProtocolMember");
    }
  }

  function _throwIfProtocolPaused(IStore s) internal view {
    IPausable protocol = IPausable(getProtocolAddress(s));

    if (protocol.paused()) {
      revert ProtocolPausedError();
    }
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                         For Future Use
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // function _hasAccess(IStore s, bytes32 role, address user) internal view returns (bool) {
  //   address protocol = getProtocolAddress(s);

  //   // The protocol is not deployed yet. Therefore, no role to check
  //   if (protocol == address(0)) {
  //     return false;
  //   }

  //   return IAccessControlUpgradeable(protocol).hasRole(role, user);
  // }

  // function _throwIfWithoutRole(IStore s, bytes32 role, address caller) internal view {
  //   if (_hasAccess(s, role, caller) == false) {
  //     revert AccessDeniedError(role);
  //   }
  // }
}
