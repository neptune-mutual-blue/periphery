// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./GaugeControllerRegistryPool.sol";
import "../util/TokenRecovery.sol";

contract GaugeControllerRegistry is AccessControlUpgradeable, PausableUpgradeable, TokenRecovery, GaugeControllerRegistryPool {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(uint256 lastEpoch, address admin, address gaugeAgent, address[] calldata pausers, IERC20Upgradeable rewardToken) external initializer {
    super.__AccessControl_init();
    super.__Pausable_init();

    if (admin == address(0)) {
      revert InvalidArgumentError("admin");
    }

    if (gaugeAgent == address(0)) {
      revert InvalidArgumentError("gaugeAgent");
    }

    if (address(rewardToken) == address(0)) {
      revert InvalidArgumentError("rewardToken");
    }

    _epoch = lastEpoch;

    _setRoleAdmin(NS_GAUGE_AGENT, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_PAUSER, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_RECOVERY_AGENT, DEFAULT_ADMIN_ROLE);

    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _setupRole(NS_GAUGE_AGENT, gaugeAgent);

    for (uint256 i = 0; i < pausers.length; i++) {
      _setupRole(NS_ROLES_PAUSER, pausers[i]);
    }

    _setupRole(NS_ROLES_RECOVERY_AGENT, admin);
    _rewardToken = rewardToken;
  }

  function addOrEditPools(ILiquidityGaugePool[] calldata pools) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (pools.length == 0) {
      revert InvalidArgumentError("pools");
    }

    for (uint256 i = 0; i < pools.length; i++) {
      _addOrEditPool(pools[i]);
    }
  }

  function deactivatePool(bytes32 key) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _deactivatePool(key);
  }

  function activatePool(bytes32 key) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _activatePool(key);
  }

  function deletePool(bytes32 key) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _deletePool(key);
  }

  function setGauge(uint256 epoch, uint256 amountToDeposit, uint256 epochDuration, Gauge[] calldata distribution) external onlyRole(NS_GAUGE_AGENT) {
    if (epoch == 0) {
      revert InvalidArgumentError("epoch");
    }

    if (epochDuration == 0) {
      revert InvalidArgumentError("epochDuration");
    }

    if (amountToDeposit == 0) {
      revert InvalidArgumentError("amountToDeposit");
    }

    if (distribution.length == 0) {
      revert InvalidArgumentError("distribution");
    }

    if (epoch != _epoch + 1) {
      revert InvalidGaugeEpochError();
    }

    _rewardToken.safeTransferFrom(_msgSender(), address(this), amountToDeposit);
    emit GaugeAllocationTransferred(epoch, amountToDeposit);

    _epoch = epoch;
    uint256 total = 0;

    for (uint256 i = 0; i < distribution.length; i++) {
      bytes32 key = distribution[i].key;
      ILiquidityGaugePool pool = _pools[key];

      if (_validPools[key] == false) {
        revert PoolNotFoundError(key);
      }

      if (_activePools[key] == false) {
        revert PoolNotActiveError(key);
      }

      total += distribution[i].emission;

      _rewardToken.safeTransfer(address(pool), distribution[i].emission);
      pool.setEpoch(epoch, epochDuration, distribution[i].emission);

      emit GaugeSet(epoch, key, pool, distribution[i].emission);
    }

    if (amountToDeposit < total) {
      revert BalanceInsufficientError(total, amountToDeposit);
    }

    _epochDurations[epoch] = epochDuration;
    _gaugeAllocations[epoch] = amountToDeposit;

    _sumAllocation += amountToDeposit;
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
