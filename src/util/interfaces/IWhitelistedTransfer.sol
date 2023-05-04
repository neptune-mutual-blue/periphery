// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IWhitelistedTransfer {
  event TransferWhitelistUpdated(address indexed updatedBy, address[] accounts, bool[] statuses);

  function isInTransferWhitelist(address account) external view returns (bool);
}
