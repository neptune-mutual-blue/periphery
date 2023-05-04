// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IGaugeControllerRegistry.sol";
import "./interfaces/ILiquidityGaugePool.sol";
import "../escrow/interfaces/IVoteEscrowToken.sol";

abstract contract LiquidityGaugePoolReward is ILiquidityGaugePool, ReentrancyGuard {
  using SafeERC20 for IERC20;

  struct Reward {
    address token;
    uint256 amount;
  }

  IVoteEscrowToken internal _veNpm;
  IERC20 internal _npm;
  IGaugeControllerRegistry internal _registry;
  address internal _treasury;

  uint256 internal constant _DENOMINATOR = 10_000;
  uint256 internal constant _MILLISECONDS_IN_WEEK = 604_800_000;

  mapping(bytes32 => mapping(address => uint256)) internal _poolLastRewardHeights;
  mapping(bytes32 => mapping(address => uint256)) internal _poolStakedByMe;
  mapping(bytes32 => uint256) internal _poolStakedByEveryone;

  uint256 internal _totalVotingPower;
  mapping(address => uint256) internal _myVotingPower;

  constructor(IVoteEscrowToken veNpm, IERC20 npm, IGaugeControllerRegistry registry, address treasury) {
    require(address(veNpm) != address(0), "Error: invalid veNPM");
    require(address(registry) != address(0), "Error: invalid registry");
    require(address(treasury) != address(0), "Error: invalid treasury");

    _intialize(veNpm, npm, registry, treasury);
  }

  function _intialize(IVoteEscrowToken veNpm, IERC20 npm, IGaugeControllerRegistry registry, address treasury) internal {
    emit LiquidityGaugePoolInitialized(_veNpm, veNpm, _npm, npm, _registry, registry, _treasury, treasury);

    if (address(veNpm) != address(0)) {
      _veNpm = veNpm;
    }

    if (address(npm) != address(0)) {
      _npm = npm;
    }

    if (address(registry) != address(0)) {
      _registry = registry;
    }

    if (address(treasury) != address(0)) {
      _treasury = treasury;
    }
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                       Reward Calculation
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _getRewardPoolBalance() internal view returns (uint256) {
    uint256 deposit = _registry.sumNpmDeposited();
    uint256 withdrawal = _registry.sumNpmWithdrawn();

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

    // Combining points of LP tokens and veNPM
    uint256 myWeight = _poolStakedByMe[key][account] + ((_myVotingPower[account] * veBoostRatio) / _DENOMINATOR);
    uint256 totalWeight = _poolStakedByEveryone[key] + ((_totalVotingPower * veBoostRatio) / _DENOMINATOR);

    uint256 reward = (_registry.getEmissionPerBlock(key) * myWeight * totalBlocks) / totalWeight;

    return reward > poolBalance ? poolBalance : reward;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                       Reward Withdrawals
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _withdrawRewards(bytes32 key) internal returns (IGaugeControllerRegistry.PoolSetupArgs memory pool) {
    pool = _registry.get(key);

    // Pool is inactive
    if (_registry.isActive(key) == false) {
      return pool;
    }

    require(pool.platformFee <= _DENOMINATOR, "Invalid reward platform fee");

    _poolLastRewardHeights[key][msg.sender] = block.number;

    uint256 rewards = _calculateReward(pool.staking.ratio, key, msg.sender);

    if (rewards == 0) {
      return pool;
    }

    uint256 platformFee = (rewards * pool.platformFee) / _DENOMINATOR;
    _registry.withdrawRewards(key, rewards);

    // Avoid underflow
    if (rewards > platformFee) {
      _npm.safeTransfer(msg.sender, rewards - platformFee);
    }

    if (platformFee > 0) {
      _npm.safeTransfer(_treasury, platformFee);
    }

    emit LiquidityGaugeRewardsWithdrawn(key, msg.sender, _treasury, rewards, platformFee);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Voting Power
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _updateVotingPowers() private {
    uint256 previous = _myVotingPower[msg.sender];
    uint256 previousTotal = _totalVotingPower;

    uint256 current = _veNpm.getVotingPower(msg.sender);

    _totalVotingPower = _totalVotingPower + current - previous;
    _myVotingPower[msg.sender] = current;

    emit VotingPowersUpdated(msg.sender, previous, current, previousTotal, _totalVotingPower);
  }
}
