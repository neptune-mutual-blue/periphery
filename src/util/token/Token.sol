// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../TokenRecovery.sol";
import "./TokenState.sol";

contract Token is ERC20Upgradeable, AccessControlUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, TokenRecovery, TokenState {
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    super._disableInitializers();
  }

  function initialize(address admin, address minter, string memory tokenName, string memory tokenSymbol) external initializer {
    if (admin == address(0)) {
      revert InvalidArgumentError("admin");
    }

    if (minter == address(0)) {
      revert InvalidArgumentError("minter");
    }

    if (bytes(tokenName).length == 0) {
      revert InvalidArgumentError("tokenName");
    }

    if (bytes(tokenSymbol).length == 0) {
      revert InvalidArgumentError("tokenSymbol");
    }

    super.__ERC20_init(tokenName, tokenSymbol);
    super.__AccessControl_init();
    super.__Pausable_init();
    super.__ReentrancyGuard_init();

    _setRoleAdmin(NS_ROLES_MINTER, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_PAUSER, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_RECOVERY_AGENT, DEFAULT_ADMIN_ROLE);

    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _setupRole(NS_ROLES_RECOVERY_AGENT, admin);
    _setupRole(NS_ROLES_MINTER, minter);
  }

  function mint(address account, uint256 amount) external whenNotPaused onlyRole(NS_ROLES_MINTER) {
    super._mint(account, amount);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Recoverable
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  function recoverEther(address sendTo) external onlyRole(NS_ROLES_RECOVERY_AGENT) {
    super._recoverEther(sendTo);
  }

  function recoverToken(IERC20Upgradeable malicious, address sendTo) external onlyRole(NS_ROLES_RECOVERY_AGENT) {
    super._recoverToken(malicious, sendTo);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Pausable
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function pause() external onlyRole(NS_ROLES_PAUSER) {
    super._pause();
  }

  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    super._unpause();
  }
}
