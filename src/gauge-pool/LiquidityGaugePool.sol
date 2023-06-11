// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../util/TokenRecovery.sol";
import "../util/WithPausability.sol";
import "./LiquidityGaugePoolReward.sol";

contract LiquidityGaugePool is ReentrancyGuardUpgradeable, AccessControlUpgradeable, WithPausability, TokenRecovery, LiquidityGaugePoolReward {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    super._disableInitializers();
  }

  function initialize(address admin, PoolInfo calldata args) external initializer {
    super.__AccessControl_init();
    super.__Pausable_init();
    super.__ReentrancyGuard_init();

    // RBAC
    _setRoleAdmin(NS_ROLES_PAUSER, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_RECOVERY_AGENT, DEFAULT_ADMIN_ROLE);
    _setupRole(DEFAULT_ADMIN_ROLE, admin);

    _setPool(args);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                             Danger!!! External & Public Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function deposit(uint256 amount) external override nonReentrant whenNotPaused {
    if (amount == 0) {
      revert ZeroAmountError("amount");
    }

    if (_epoch == 0) {
      revert EpochUnavailableError();
    }

    _updateReward(_msgSender());

    _lockedByEveryone += amount;
    _lockedByMe[_msgSender()] += amount;
    _lastDepositHeights[_msgSender()] = block.number;

    _poolInfo.stakingToken.safeTransferFrom(_msgSender(), address(this), amount);

    emit LiquidityGaugePoolDeposited(_msgSender(), amount);
  }

  function _withdraw(uint256 amount) private {
    if (amount == 0) {
      revert ZeroAmountError("amount");
    }

    if (block.number < _lastDepositHeights[_msgSender()] + _poolInfo.lockupPeriodInBlocks) {
      revert WithdrawalLockedError(_lastDepositHeights[_msgSender()] + _poolInfo.lockupPeriodInBlocks);
    }

    _updateReward(_msgSender());

    _lockedByEveryone -= amount;
    _lockedByMe[_msgSender()] -= amount;
    _poolInfo.stakingToken.safeTransfer(_msgSender(), amount);

    emit LiquidityGaugePoolWithdrawn(_msgSender(), amount);
  }

  function withdraw(uint256 amount) external override nonReentrant whenNotPaused {
    _withdraw(amount);
  }

  function _withdrawRewards() private {
    _updateReward(_msgSender());

    uint256 reward = _pendingRewardToDistribute[_msgSender()];

    if (reward > 0) {
      uint256 platformFee = (reward * _poolInfo.platformFee) / _denominator();

      if (reward <= platformFee) {
        revert PlatformFeeTooHighError(_poolInfo.platformFee);
      }

      _pendingRewardToDistribute[_msgSender()] = 0;
      _poolInfo.rewardToken.safeTransfer(_msgSender(), reward - platformFee);

      if (platformFee > 0) {
        _poolInfo.rewardToken.safeTransfer(_poolInfo.treasury, platformFee);
      }

      emit LiquidityGaugePoolRewardsWithdrawn(_msgSender(), reward, platformFee);
    }
  }

  function withdrawRewards() external override nonReentrant whenNotPaused {
    _withdrawRewards();
  }

  function exit() external override nonReentrant whenNotPaused {
    _withdraw(_lockedByMe[_msgSender()]);
    _withdrawRewards();
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                 Gauge Controller Registry Only
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function setPool(PoolInfo calldata args) external override onlyRegistry {
    super._setPool(args);
  }

  function setEpoch(uint256 epoch, uint256 epochDuration, uint256 reward) external override onlyRegistry {
    _updateReward(address(0));

    if (epochDuration > 0) {
      _setEpochDuration(epochDuration);
    }

    if (block.timestamp >= _epochEndTimestamp) {
      _rewardPerSecond = reward / _poolInfo.epochDuration;
    } else {
      uint256 remaining = _epochEndTimestamp - block.timestamp;
      uint256 leftover = remaining * _rewardPerSecond;
      _rewardPerSecond = (reward + leftover) / _poolInfo.epochDuration;
    }

    if (epoch <= _epoch) {
      revert InvalidArgumentError("epoch");
    }

    _epoch = epoch;

    if (_poolInfo.epochDuration * _rewardPerSecond > _poolInfo.rewardToken.balanceOf(address(this))) {
      revert BalanceInsufficientError(_poolInfo.epochDuration * _rewardPerSecond, _poolInfo.rewardToken.balanceOf(address(this)));
    }

    _lastRewardTimestamp = block.timestamp;
    _epochEndTimestamp = block.timestamp + _poolInfo.epochDuration;

    emit EpochRewardSet(_msgSender(), reward);
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

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Getters
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function calculateReward(address account) external view returns (uint256) {
    return _getPendingRewards(account);
  }

  function getKey() external view override returns (bytes32) {
    return _poolInfo.key;
  }
}
