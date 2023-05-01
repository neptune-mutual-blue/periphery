// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/security/Pausable.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

abstract contract WithPausability is Pausable, Ownable {
  mapping(address => bool) private _pausers;

  event PausersSet(address indexed addedBy, address[] accounts, bool[] statuses);

  function _setPausers(address[] calldata accounts, bool[] calldata statuses) internal {
    require(accounts.length > 0, "No pauser specified");
    require(accounts.length == statuses.length, "Invalid args");

    for (uint256 i = 0; i < accounts.length; i++) {
      _pausers[accounts[i]] = statuses[i];
    }

    emit PausersSet(msg.sender, accounts, statuses);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                             Danger!!! External & Public Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function isPauser(address account) public view returns (bool) {
    return _pausers[account];
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Modifiers
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  modifier onlyPausers() {
    require(isPauser(msg.sender), "Forbidden");
    _;
  }
}
