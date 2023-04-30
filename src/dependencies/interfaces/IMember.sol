// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IMember {
  function version() external pure returns (bytes32);
  function getName() external pure returns (bytes32);
}
