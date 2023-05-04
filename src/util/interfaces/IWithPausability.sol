// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

interface IWithPausability {
  event PausersSet(address indexed addedBy, address[] accounts, bool[] statuses);

  function isPauser(address account) external view returns (bool);
}
