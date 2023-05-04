// solhint-disable
// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../dependencies/interfaces/IStore.sol";
import "./interfaces/IWhitelistedTransfer.sol";

abstract contract WhitelistedTransfer is IWhitelistedTransfer {
  bytes32 private constant _NS_MEMBERS = "ns:members";
  mapping(address => bool) private _whitelist;

  function isInTransferWhitelist(address account) public view returns (bool) {
    return _whitelist[account];
  }

  function _updateTransferWhitelist(address[] calldata accounts, bool[] memory statuses) internal {
    require(accounts.length > 0, "No account");
    require(accounts.length == statuses.length, "Invalid args");

    for (uint256 i = 0; i < accounts.length; i++) {
      _whitelist[accounts[i]] = statuses[i];
    }

    emit TransferWhitelistUpdated(msg.sender, accounts, statuses);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Validations
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _throwIfNonWhitelistedTransfer(IStore s, address from, address to, uint256) internal view {
    // Token mints
    if (from == address(0)) {
      // aren't restricted
      return;
    }

    // Someone not whitelisted
    // ............................ can still transfer to a whitelisted address
    if (_whitelist[from] == false && _whitelist[to] == false) {
      // and to the Neptune Mutual Protocol contracts but nowhere else
      _throwIfNotProtocolMember(s, to);
    }
  }

  function _throwIfNotProtocolMember(IStore s, address account) internal view {
    bytes32 key = keccak256(abi.encodePacked(_NS_MEMBERS, account));
    bool isMember = s.getBool(key);

    // veNpm can only be used within the Neptune Mutual protocol
    require(isMember == true, "Access denied");
  }
}
