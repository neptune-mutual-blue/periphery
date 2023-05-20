// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "../gauge-registry/GaugeControllerRegistry.sol";
import "./interfaces/ILiquidityGaugePool.sol";
import "../escrow/interfaces/IVoteEscrowToken.sol";
import "./LiquidityGaugePoolState.sol";

abstract contract LiquidityGaugePoolReward is ILiquidityGaugePool, LiquidityGaugePoolState, ReentrancyGuardUpgradeable, ContextUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  function _denominator() private pure returns (uint256) {
    return 10_000;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                       Reward Calculation
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _getRewardPoolBalance() internal view returns (uint256) {
    IGaugeControllerRegistry registry = IGaugeControllerRegistry(_registry);

    uint256 deposit = registry.sumNpmDeposited();
    uint256 withdrawal = registry.sumNpmWithdrawn();

    // Avoid underflow
    if (deposit > withdrawal) {
      return deposit - withdrawal;
    }

    return 0;
  }

  function _getTotalBlocksSinceLastReward(bytes32 key, address account) internal view returns (uint256) {
    uint256 from = _poolLastRewardHeights[key][account];

    if (from == 0) {
      return 0;
    }

    // Avoid underflow
    if (from > block.number) {
      return 0;
    }

    return block.number - from;
  }

  function _calculateReward(uint256 veBoostRatio, bytes32 key, address account) internal view returns (uint256) {
    uint256 totalBlocks = _getTotalBlocksSinceLastReward(key, account);
    uint256 poolBalance = _getRewardPoolBalance();

    if (poolBalance == 0 || totalBlocks == 0) {
      return 0;
    }

    // Combining points of LP tokens and veToken
    uint256 myWeight = _poolStakedByMe[key][account] + ((_myVotingPower[account] * veBoostRatio) / _denominator());
    uint256 totalWeight = _poolStakedByEveryone[key] + ((_totalVotingPower * veBoostRatio) / _denominator());

    if (totalWeight == 0) {
      return 0;
    }

    uint256 reward = (IGaugeControllerRegistry(_registry).getEmissionPerBlock(key) * myWeight * totalBlocks) / totalWeight;

    return reward > poolBalance ? poolBalance : reward;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                       Reward Withdrawals
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _withdrawRewards(bytes32 key) internal returns (IGaugeControllerRegistry.PoolSetupArgs memory pool) {
    IGaugeControllerRegistry registry = IGaugeControllerRegistry(_registry);
    pool = registry.get(key);

    _updateVotingPowers();

    // Pool is inactive
    if (registry.isActive(key) == false) {
      return pool;
    }

    if (pool.platformFee > _denominator()) {
      revert PlatformFeeTooHighError(key, pool.platformFee);
    }

    _poolLastRewardHeights[key][_msgSender()] = block.number;

    uint256 rewards = _calculateReward(pool.staking.ratio, key, _msgSender());

    if (rewards == 0) {
      return pool;
    }

    uint256 platformFee = (rewards * pool.platformFee) / _denominator();
    registry.withdrawRewards(key, rewards);

    // Avoid underflow
    if (rewards > platformFee) {
      IERC20Upgradeable(_rewardToken).safeTransfer(_msgSender(), rewards - platformFee);
    }

    if (platformFee > 0) {
      IERC20Upgradeable(_rewardToken).safeTransfer(_treasury, platformFee);
    }

    emit LiquidityGaugeRewardsWithdrawn(key, _msgSender(), _treasury, rewards, platformFee);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Voting Power
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _updateVotingPowers() private {
    uint256 previous = _myVotingPower[_msgSender()];
    uint256 previousTotal = _totalVotingPower;

    uint256 current = IVoteEscrowToken(_veToken).getVotingPower(_msgSender());

    _totalVotingPower = _totalVotingPower + current - previous;
    _myVotingPower[_msgSender()] = current;

    emit VotingPowersUpdated(_msgSender(), previous, current, previousTotal, _totalVotingPower);
  }
}
