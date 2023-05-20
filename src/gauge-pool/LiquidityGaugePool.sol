// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../util/TokenRecovery.sol";
import "../util/WithPausability.sol";
import "./LiquidityGaugePoolReward.sol";

contract LiquidityGaugePool is LiquidityGaugePoolReward, OwnableUpgradeable, WithPausability, TokenRecovery {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    super._disableInitializers();
  }

  function initialize(address contractOwner, address veToken, address rewardToken, address registry, address treasury) external initializer {
    if (veToken == address(0)) {
      revert ZeroAddressError("veToken");
    }

    if (registry == address(0)) {
      revert ZeroAddressError("registry");
    }

    if (treasury == address(0)) {
      revert ZeroAddressError("treasury");
    }

    _setAddresses(veToken, rewardToken, registry, treasury);

    super.__Ownable_init();
    super.__Pausable_init();
    super.__ReentrancyGuard_init();

    super.transferOwnership(contractOwner);
  }

  function _setAddresses(address veToken, address rewardToken, address registry, address treasury) internal {
    emit LiquidityGaugePoolInitialized(_veToken, veToken, _registry, registry, _treasury, treasury);

    if (veToken != address(0)) {
      _veToken = veToken;
    }

    if (registry != address(0)) {
      _registry = registry;
    }

    if (treasury != address(0)) {
      _treasury = treasury;
    }

    if (rewardToken != address(0)) {
      _rewardToken = rewardToken;
    }
  }

  function setAddresses(address veToken, address rewardToken, address registry, address treasury) external override onlyOwner {
    _setAddresses(veToken, rewardToken, registry, treasury);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                             Danger!!! External & Public Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function deposit(bytes32 key, uint256 amount) external override nonReentrant whenNotPaused {
    IGaugeControllerRegistry registry = IGaugeControllerRegistry(_registry);

    if (registry.isValid(key) == false) {
      revert PoolNotFoundError(key);
    }

    if (registry.isActive(key) == false) {
      revert PoolNotActiveError(key);
    }

    if (amount == 0) {
      revert ZeroAmountError("amount");
    }

    // First withdraw your rewards
    IGaugeControllerRegistry.PoolSetupArgs memory pool = _withdrawRewards(key);

    _canWithdrawFrom[key][_msgSender()] = block.number + pool.staking.lockupPeriodInBlocks;

    IERC20Upgradeable stakingToken = IERC20Upgradeable(pool.staking.token);

    stakingToken.safeTransferFrom(_msgSender(), address(this), amount);
    // slither-disable-previous-line arbitrary-send-erc20

    _poolStakedByMe[key][_msgSender()] += amount;
    _poolStakedByEveryone[key] += amount;

    emit LiquidityGaugeDeposited(key, _msgSender(), pool.staking.token, amount);
  }

  function withdraw(bytes32 key, uint256 amount) external override nonReentrant whenNotPaused {
    if (IGaugeControllerRegistry(_registry).isValid(key) == false) {
      revert PoolNotFoundError(key);
    }

    if (amount == 0) {
      revert ZeroAmountError("amount");
    }

    if (_poolStakedByMe[key][_msgSender()] < amount) {
      revert BalanceInsufficientError(_poolStakedByMe[key][_msgSender()], amount);
    }

    if (block.number < _canWithdrawFrom[key][_msgSender()]) {
      revert WithdrawalLockedError(_canWithdrawFrom[key][_msgSender()]);
    }

    // First withdraw your rewards
    IGaugeControllerRegistry.PoolSetupArgs memory pool = _withdrawRewards(key);

    IERC20Upgradeable stakingToken = IERC20Upgradeable(pool.staking.token);

    _poolStakedByMe[key][_msgSender()] -= amount;
    _poolStakedByEveryone[key] -= amount;

    stakingToken.safeTransfer(_msgSender(), amount);

    emit LiquidityGaugeWithdrawn(key, _msgSender(), pool.staking.token, amount);
  }

  function withdrawRewards(bytes32 key) external override nonReentrant whenNotPaused returns (IGaugeControllerRegistry.PoolSetupArgs memory) {
    return _withdrawRewards(key);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Getters
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function calculateReward(bytes32 key, address account) external view returns (uint256) {
    IGaugeControllerRegistry.PoolSetupArgs memory pool = IGaugeControllerRegistry(_registry).get(key);
    return _calculateReward(pool.staking.ratio, key, account);
  }

  function getTotalBlocksSinceLastReward(bytes32 key, address account) external view override returns (uint256) {
    return _getTotalBlocksSinceLastReward(key, account);
  }
}
