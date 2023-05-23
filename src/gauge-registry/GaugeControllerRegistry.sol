// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../util/ProtocolMembership.sol";
import "../util/TokenRecovery.sol";
import "../dependencies/interfaces/IVault.sol";
import "../dependencies/interfaces/IStore.sol";
import "./GaugeControllerRegistryState.sol";

contract GaugeControllerRegistry is AccessControlUpgradeable, PausableUpgradeable, TokenRecovery, GaugeControllerRegistryState {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function _denominator() private pure returns (uint256) {
    return 10_000;
  }

  function initialize(address admin, address gaugeAgent, address[] calldata pausers, address rewardToken) external initializer {
    super.__AccessControl_init();
    super.__Pausable_init();

    _rewardToken = rewardToken;

    _setRoleAdmin(NS_GAUGE_AGENT, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_PAUSER, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_RECOVERY_AGENT, DEFAULT_ADMIN_ROLE);

    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _setupRole(NS_GAUGE_AGENT, gaugeAgent);

    for (uint256 i = 0; i < pausers.length; i++) {
      _setupRole(NS_ROLES_PAUSER, pausers[i]);
    }

    _setupRole(NS_ROLES_RECOVERY_AGENT, admin);
  }

  function addOrEditPool(bytes32 key, PoolSetupArgs calldata args) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    bool adding = _validPools[key] == false;

    if (adding) {
      if (bytes(args.name).length == 0) {
        revert EmptyArgumentError("args.name");
      }

      if (args.staking.token == address(0)) {
        revert ZeroAddressError("args.staking.token");
      }

      _validPools[key] = true;
      _activePools[key] = true;

      _pools[key] = args;
    } else {
      if (_activePools[key] == false) {
        revert PoolDeactivatedError(key);
      }

      if (bytes(args.name).length > 0) {
        _pools[key].name = args.name;
      }

      if (bytes(args.info).length > 0) {
        _pools[key].info = args.info;
      }

      if (args.staking.lockupPeriodInBlocks > 0) {
        _pools[key].staking.lockupPeriodInBlocks = args.staking.lockupPeriodInBlocks;
      }

      if (args.staking.ratio > 0) {
        _pools[key].staking.ratio = args.staking.ratio;
      }
    }

    if (args.platformFee > _denominator()) {
      revert PlatformFeeTooHighError(key, args.platformFee);
    }

    _pools[key].platformFee = args.platformFee;

    emit GaugeControllerRegistryPoolAddedOrEdited(_msgSender(), key, args);
  }

  function setGauge(uint256 epoch, uint256 amountToDeposit, Gauge[] calldata distribution, uint256 approximateBlocksPerEpoch) external override onlyRole(NS_GAUGE_AGENT) {
    if (epoch == 0) {
      revert InvalidGaugeEpochError();
    }

    if (epoch != _epoch + 1) {
      revert InvalidGaugeEpochError();
    }

    _epoch = epoch;
    uint256 total = 0;

    for (uint256 i = 0; i < distribution.length; i++) {
      bytes32 key = distribution[i].key;

      if (_validPools[key] == false) {
        revert PoolNotFoundError(key);
      }

      if (_activePools[key] == false) {
        revert PoolNotActiveError(key);
      }

      // @todo: check for precision loss
      _emissionsPerBlock[key] = distribution[i].emissionPerEpoch / approximateBlocksPerEpoch;
      total += distribution[i].emissionPerEpoch;

      emit GaugeSet(epoch, distribution[i].emissionPerEpoch);
    }

    if (amountToDeposit < total) {
      revert BalanceInsufficientError(total, amountToDeposit);
    }

    IERC20Upgradeable npm = IERC20Upgradeable(_rewardToken);

    // slither-disable-start arbitrary-send-erc20
    npm.safeTransferFrom(_msgSender(), address(this), amountToDeposit);
    // slither-disable-end arbitrary-send-erc20

    _guageAllocations[epoch] = amountToDeposit;
    _sumNpmDeposits += amountToDeposit;

    emit GaugeAllocationTransferred(epoch, amountToDeposit);
  }

  function withdrawRewards(bytes32 key, uint256 amount) external override onlyOperator whenNotPaused {
    IERC20Upgradeable npm = IERC20Upgradeable(_rewardToken);

    _sumNpmWithdrawals += amount;

    npm.safeTransfer(_msgSender(), amount);

    emit GaugeControllerRegistryRewardsWithdrawn(key, amount);
  }

  function deactivatePool(bytes32 key) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    if (_validPools[key] == false) {
      revert PoolNotFoundError(key);
    }

    if (_activePools[key] == false) {
      revert PoolAlreadyDeactivatedError(key);
    }

    delete _activePools[key];

    emit GaugeControllerRegistryPoolDeactivated(_msgSender(), key);
  }

  function activatePool(bytes32 key) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    if (_validPools[key] == false) {
      revert PoolNotFoundError(key);
    }

    if (_activePools[key]) {
      revert PoolAlreadyActiveError(key);
    }

    _activePools[key] = true;

    emit GaugeControllerRegistryPoolActivated(_msgSender(), key);
  }

  function deletePool(bytes32 key) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    if (_validPools[key] == false) {
      revert PoolNotFoundError(key);
    }

    if (_activePools[key]) {
      revert PoolNotDeactivatedError(key);
    }

    delete _validPools[key];
    delete _pools[key];

    emit GaugeControllerRegistryPoolDeleted(_msgSender(), key);
  }

  function setOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
    emit GaugeControllerRegistryOperatorSet(_operator, operator);

    _operator = operator;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Modifiers
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  modifier onlyOperator() {
    if (_msgSender() != _operator) {
      revert AccessDeniedError("operator");
    }

    _;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Getters
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function isValid(bytes32 key) external view override returns (bool) {
    return _validPools[key];
  }

  function isActive(bytes32 key) external view override returns (bool) {
    return _activePools[key];
  }

  function get(bytes32 key) external view override returns (PoolSetupArgs memory) {
    return _pools[key];
  }

  function sumNpmDeposited() external view override returns (uint256) {
    return _sumNpmDeposits;
  }

  function sumNpmWithdrawn() external view override returns (uint256) {
    return _sumNpmWithdrawals;
  }

  function getLastEpoch() external view override returns (uint256) {
    return _epoch;
  }

  function getAllocation(uint256 epoch) external view override returns (uint256) {
    return _guageAllocations[epoch];
  }

  function getEmissionPerBlock(bytes32 key) external view override returns (uint256) {
    return _emissionsPerBlock[key];
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
