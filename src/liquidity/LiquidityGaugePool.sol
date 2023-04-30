// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "../util/interfaces/IControlledVault.sol";
import "../util/ProtocolMembership.sol";
import "../util/TokenRecovery.sol";
import "../util/WithPausability.sol";
import "./interfaces/IGaugeControllerRegistry.sol";
import "./LiquidityGaugePoolReward.sol";

contract LiquidityGaugePool is LiquidityGaugePoolReward, ProtocolMembership, Ownable, WithPausability, TokenRecovery {
  using SafeERC20 for IERC20;

  mapping(bytes32 => mapping(address => uint256)) _canWithdrawFrom;

  constructor(IVoteEscrowToken veNpm, IGaugeControllerRegistry registry, IStore protocolStore, address treasury) ProtocolMembership(protocolStore) LiquidityGaugePoolReward(veNpm, registry, treasury) {}

  function deposit(bytes32 key, uint256 amount) external nonReentrant {
    _throwIfProtocolPaused();
    require(_registry.isValid(key), "Error: pool not found");
    require(_registry.isActive(key), "Error: pool inactive");

    require(amount > 0, "Error: invalid amount");

    // First withdraw your rewards
    IGaugeControllerRegistry.PoolSetupArgs memory pool = _withdrawRewards(key);

    _canWithdrawFrom[key][msg.sender] = block.number + pool.staking.lockupPeriod;

    IERC20 stakingToken = IERC20(pool.staking.pod);

    stakingToken.safeTransferFrom(msg.sender, address(this), amount);

    _poolStakedByMe[key][msg.sender] += amount;
    _poolStakedByEveryone[key] += amount;
  }

  function withdraw(bytes32 key, uint256 amount) external nonReentrant {
    _throwIfProtocolPaused();
    require(_registry.isValid(key), "Error: pool not found");

    // @note: do not uncomment the following line
    // Inactive pools permit withdrawals but do not accept deposits or offer rewards.
    // require(_registry.isActive(key), "Error: pool inactive");

    require(amount > 0, "Error: invalid amount");
    require(_poolStakedByMe[key][msg.sender] >= amount, "Error: insufficient balance");

    require(block.number >= _canWithdrawFrom[key][msg.sender], "Error: too early");

    // First withdraw your rewards
    IGaugeControllerRegistry.PoolSetupArgs memory pool = _withdrawRewards(key);

    IERC20 stakingToken = IERC20(pool.staking.pod);

    _poolStakedByMe[key][msg.sender] -= amount;
    _poolStakedByEveryone[key] -= amount;

    stakingToken.safeTransfer(msg.sender, amount);
  }

  function withdrawRewards(bytes32 key) external nonReentrant returns (IGaugeControllerRegistry.PoolSetupArgs memory) {
    return _withdrawRewards(key);
  }
}
