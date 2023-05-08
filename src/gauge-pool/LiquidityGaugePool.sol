// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../util/TokenRecovery.sol";
import "../util/WithPausability.sol";
import "./LiquidityGaugePoolReward.sol";

contract LiquidityGaugePool is LiquidityGaugePoolReward, WithPausability, TokenRecovery {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    super._disableInitializers();
  }

  function initialize(address contractOwner, address veNpm, address registry, IStore protocolStore, address treasury) external initializer {
    if (veNpm == address(0)) {
      revert ZeroAddressError("veNPM");
    }

    if (registry == address(0)) {
      revert ZeroAddressError("registry");
    }

    if (treasury == address(0)) {
      revert ZeroAddressError("treasury");
    }

    _s = protocolStore;
    _setAddresses(veNpm, registry, treasury);

    super.__Ownable_init();
    super.__Pausable_init();
    super.__ReentrancyGuard_init();

    super.transferOwnership(contractOwner);
  }

  function _setAddresses(address veNpm, address registry, address treasury) internal {
    emit LiquidityGaugePoolInitialized(_veNpm, veNpm, _registry, registry, _treasury, treasury);

    if (veNpm != address(0)) {
      _veNpm = veNpm;
    }

    if (registry != address(0)) {
      _registry = registry;
    }

    if (treasury != address(0)) {
      _treasury = treasury;
    }
  }

  function setAddresses(address veNpm, address registry, address treasury) external override onlyOwner {
    _throwIfProtocolPaused(_s);
    _setAddresses(veNpm, registry, treasury);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                             Danger!!! External & Public Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function deposit(bytes32 key, uint256 amount) external override nonReentrant {
    _throwIfProtocolPaused(_s);

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

    IERC20Upgradeable stakingToken = IERC20Upgradeable(pool.staking.pod);

    stakingToken.safeTransferFrom(_msgSender(), address(this), amount);
    // slither-disable-previous-line arbitrary-send-erc20

    _poolStakedByMe[key][_msgSender()] += amount;
    _poolStakedByEveryone[key] += amount;

    emit LiquidityGaugeDeposited(key, _msgSender(), address(pool.staking.pod), amount);
  }

  function withdraw(bytes32 key, uint256 amount) external override nonReentrant {
    _throwIfProtocolPaused(_s);

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

    IERC20Upgradeable stakingToken = IERC20Upgradeable(pool.staking.pod);

    _poolStakedByMe[key][_msgSender()] -= amount;
    _poolStakedByEveryone[key] -= amount;

    stakingToken.safeTransfer(_msgSender(), amount);

    emit LiquidityGaugeWithdrawn(key, _msgSender(), address(pool.staking.pod), amount);
  }

  function withdrawRewards(bytes32 key) external override nonReentrant returns (IGaugeControllerRegistry.PoolSetupArgs memory) {
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

  function version() external pure override returns (bytes32) {
    return "v0.1";
  }

  function getName() external pure override returns (bytes32) {
    return "Liquidity Gauge Pool";
  }
}
