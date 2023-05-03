// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface IControlledVault {
  function setController(address controller) external;
  function getController() external view returns (address);

  event ControlledVaultControllerSet(address previousController, address currentController);
  event ControlledVaultDeposited(address indexed caller, IERC20 indexed token, uint256 amount);
  event ControlledVaultWithdrawn(address indexed caller, IERC20 indexed token, uint256 amount);
}
