// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../util/ProtocolMembership.sol";
import "../util/TokenRecovery.sol";
import "../util/WithPausability.sol";
import "../dependencies/interfaces/IVault.sol";
import "../dependencies/interfaces/IStore.sol";
import "./GaugeControllerRegistryState.sol";

contract GaugeControllerRegistry is GaugeControllerRegistryState, ProtocolMembership, WithPausability, TokenRecovery {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address contractOwner, IStore protocolStore) external initializer {
    super.__Ownable_init();
    super.__Pausable_init();

    _s = protocolStore;
    super.transferOwnership(contractOwner);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                             Danger!!! External & Public Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function addOrEditPool(bytes32 key, PoolSetupArgs calldata args) external override onlyOwner {
    _throwIfProtocolPaused(_s);

    bool adding = _validPools[key] == false;

    if (adding) {
      if (bytes(args.name).length == 0) {
        revert EmptyArgumentError("args.name");
      }

      if (_validPools[key]) {
        revert PoolAlreadyExistsError(key);
      }

      if (address(args.staking.pod) == address(0)) {
        revert ZeroAddressError("args.staking.pod");
      }

      _validPools[key] = true;
      _activePools[key] = true;

      _pools[key] = args;
    } else {
      if (_validPools[key] == false) {
        revert PoolNotFoundError(key);
      }

      if (_activePools[key] == false) {
        revert PoolDeactivatedError(key);
      }

      if (bytes(args.name).length > 0) {
        _pools[key].name = args.name;
      }

      _pools[key].platformFee = args.platformFee;
    }

    emit GaugeControllerRegistryPoolAddedOrEdited(_msgSender(), key, args);
  }

  function setGauge(uint256 epoch, uint256 amountToDeposit, Gauge[] calldata distribution) external override onlyOwner {
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

      _emissionsPerBlock[key] = distribution[i].emissionPerBlock;
      total += distribution[i].emissionPerBlock;

      emit GaugeSet(epoch, distribution[i].emissionPerBlock);
    }

    if (amountToDeposit < total) {
      revert BalanceInsufficientError(total, amountToDeposit);
    }

    IERC20Upgradeable npm = IERC20Upgradeable(super._getNpm(_s));

    // slither-disable-start arbitrary-send-erc20
    npm.safeTransferFrom(_msgSender(), address(this), amountToDeposit);
    // slither-disable-end arbitrary-send-erc20

    _guageAllocations[epoch] = amountToDeposit;
    _sumNpmDeposits += amountToDeposit;

    emit GaugeAllocationTransferred(epoch, amountToDeposit);
  }

  function withdrawRewards(bytes32 key, uint256 amount) external override onlyOperator {
    _throwIfProtocolPaused(_s);
    _throwIfNotProtocolMember(_s, _msgSender());

    IERC20Upgradeable npm = IERC20Upgradeable(super._getNpm(_s));

    _sumNpmWithdrawals += amount;

    npm.safeTransfer(_msgSender(), amount);

    emit GaugeControllerRegistryRewardsWithdrawn(key, amount);
  }

  function deactivatePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused(_s);

    if (_validPools[key] == false) {
      revert PoolNotFoundError(key);
    }

    if (_activePools[key] == false) {
      revert PoolAlreadyDeactivatedError(key);
    }

    _activePools[key] = false;

    emit GaugeControllerRegistryPoolDeactivated(_msgSender(), key);
  }

  function activatePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused(_s);

    if (_validPools[key] == false) {
      revert PoolNotFoundError(key);
    }

    if (_activePools[key]) {
      revert PoolAlreadyActiveError(key);
    }

    _activePools[key] = true;

    emit GaugeControllerRegistryPoolActivated(_msgSender(), key);
  }

  function deletePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused(_s);

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

  function setOperator(address operator) external onlyOwner {
    _throwIfNotProtocolMember(_s, operator);
    _throwIfProtocolPaused(_s);

    emit GaugeControllerRegistryOperatorSet(_operator, operator);

    _operator == operator;
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
  function recoverEther(address sendTo) external onlyOwner {
    super._recoverEther(sendTo);
  }

  function recoverToken(IERC20Upgradeable malicious, address sendTo) external onlyOwner {
    super._recoverToken(malicious, sendTo);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Pausable
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function setPausers(address[] calldata accounts, bool[] calldata statuses) external onlyOwner whenNotPaused {
    super._setPausers(_pausers, accounts, statuses);
  }
}
