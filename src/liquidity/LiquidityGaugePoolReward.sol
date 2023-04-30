// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IGaugeControllerRegistry.sol";
import "../escrow/interfaces/IVoteEscrowToken.sol";

abstract contract LiquidityGaugePoolReward is ReentrancyGuard {
  using SafeERC20 for IERC20;

  struct Reward {
    address token;
    uint256 amount;
  }

  IVoteEscrowToken _veNpm;
  IGaugeControllerRegistry _registry;
  address _treasury;

  uint256 internal constant _DENOMINATOR = 10_000;
  mapping(bytes32 => mapping(address => uint256)) internal _poolLastRewardHeights;
  mapping(bytes32 => mapping(address => uint256)) internal _poolStakedByMe;
  mapping(bytes32 => uint256) internal _poolStakedByEveryone;

  uint256 internal _totalVotingPower;
  mapping(address => uint256) internal _myVotingPower;

  event VotingPowersUpdated(address triggeredBy, uint256 previous, uint256 current, uint256 previousTotal, uint256 currentTotal);
  event LiquidityGaugeRewardsWithdrawn(bytes32 indexed key, address indexed account, address indexed token, address treasury, uint256 rewards, uint256 platformFee);
  event LiquidityGaugePoolInitialized(IVoteEscrowToken previousVeNpm, IVoteEscrowToken veNpm, IGaugeControllerRegistry previousRegistry, IGaugeControllerRegistry registry, address previousTreasury, address treasury);

  constructor(IVoteEscrowToken veNpm, IGaugeControllerRegistry registry, address treasury) {
    require(address(veNpm) != address(0), "Error: invalid veNPM");
    require(address(registry) != address(0), "Error: invalid registry");
    require(address(treasury) != address(0), "Error: invalid treasury");

    _intialize(veNpm, registry, treasury);
  }

  function _intialize(IVoteEscrowToken veNpm, IGaugeControllerRegistry registry, address treasury) internal {
    emit LiquidityGaugePoolInitialized(_veNpm, veNpm, _registry, registry, _treasury, treasury);

    if (address(veNpm) != address(0)) {
      _veNpm = veNpm;
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
  function _getRewardPoolBalance(bytes32 key, address token) internal view returns (uint256) {
    uint256 deposit = _registry.sumRewardTokensDeposited(key, token);
    uint256 withdrawal = _registry.sumRewardTokensWithdrawn(key, token);

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

  function _calculateReward(uint256 veBoostRatio, uint256 emissionPerBlock, uint256 totalBlocks, uint256 stakedByMe, uint256 stakedByEveryone, uint256 myVotingPower, uint256 totalVotingPower) internal pure returns (uint256) {
    uint256 myWeight = stakedByMe + ((myVotingPower * veBoostRatio) / _DENOMINATOR);
    uint256 totalWeight = stakedByEveryone + ((totalVotingPower * veBoostRatio) / _DENOMINATOR);

    return (emissionPerBlock * myWeight * totalBlocks) / totalWeight;
  }

  function _getRewards(IGaugeControllerRegistry.PoolSetupArgs memory pool, bytes32 key, address account) internal view returns (Reward[] memory rewards) {
    uint256 totalBlocks = _getTotalBlocksSinceLastReward(key, account);

    if (totalBlocks == 0) {
      return rewards;
    }

    uint256 stakedByMe = _poolStakedByMe[key][account];
    uint256 stakedByEveryone = _poolStakedByEveryone[key];
    uint256 myVotingPower = _myVotingPower[account];
    uint256 totalVotingPower = _totalVotingPower;

    rewards = new Reward[](pool.rewards.length + 1);

    for (uint256 i = 0; i < pool.rewards.length; i++) {
      rewards[i].token = pool.rewards[i].token;

      uint256 reward = _calculateReward(pool.staking.ratio, pool.rewards[i].emissionPerBlock, totalBlocks, stakedByMe, stakedByEveryone, myVotingPower, totalVotingPower);

      uint256 poolBalance = _getRewardPoolBalance(key, rewards[i].token);
      rewards[i].amount = reward > poolBalance ? poolBalance : reward;
    }

    return rewards;
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

    Reward[] memory rewards = _getRewards(pool, key, msg.sender);

    for (uint256 i = 0; i < rewards.length; i++) {
      if (rewards[i].amount == 0) {
        continue;
      }

      uint256 platformFee = (rewards[i].amount * pool.platformFee) / _DENOMINATOR;
      _registry.withdrawRewards(key, IERC20(rewards[i].token), rewards[i].amount);

      // Avoid underflow
      if (rewards[i].amount > platformFee) {
        IERC20(rewards[i].token).safeTransfer(msg.sender, rewards[i].amount - platformFee);
      }

      if (platformFee > 0) {
        IERC20(rewards[i].token).safeTransfer(_treasury, platformFee);
      }

      emit LiquidityGaugeRewardsWithdrawn(key, msg.sender, rewards[i].token, _treasury, rewards[i].amount, platformFee);
    }
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
