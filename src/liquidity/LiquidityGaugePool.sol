// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "../util/ProtocolMembership.sol";
import "../util/TokenRecovery.sol";
import "../util/WithPausability.sol";
import "./LiquidityGaugePoolReward.sol";

contract LiquidityGaugePool is LiquidityGaugePoolReward, ProtocolMembership, Ownable, WithPausability, TokenRecovery {
  using SafeERC20 for IERC20;

  mapping(bytes32 => mapping(address => uint256)) private _canWithdrawFrom;

  constructor(IVoteEscrowToken veNpm, IERC20 npm, IGaugeControllerRegistry registry, IStore protocolStore, address treasury) ProtocolMembership(protocolStore) LiquidityGaugePoolReward(veNpm, npm, registry, treasury) {}

  function intialize(IVoteEscrowToken veNpm, IERC20 npm, IGaugeControllerRegistry registry, address treasury) external override onlyOwner {
    _throwIfProtocolPaused();
    super._intialize(veNpm, npm, registry, treasury);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                             Danger!!! External & Public Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  function deposit(bytes32 key, uint256 amount) external override nonReentrant {
    _throwIfProtocolPaused();
    require(_getRegistry().isValid(key), "Error: pool not found");
    require(_getRegistry().isActive(key), "Error: pool inactive");

    require(amount > 0, "Error: invalid amount");

    uint256 poolStakedByMe = _getPoolStakedByMe(key, msg.sender);
    uint256 poolStakedByEveryone = _getPoolStakedByEveryone(key);

    // First withdraw your rewards
    IGaugeControllerRegistry.PoolSetupArgs memory pool = _withdrawRewards(key);

    _canWithdrawFrom[key][msg.sender] = block.number + pool.staking.lockupPeriodInBlocks;

    IERC20 stakingToken = IERC20(pool.staking.pod);

    stakingToken.safeTransferFrom(msg.sender, address(this), amount);

    poolStakedByMe += amount;
    poolStakedByEveryone += amount;

    emit LiquidityGaugeDeposited(key, msg.sender, stakingToken, amount);
  }

  function withdraw(bytes32 key, uint256 amount) external override nonReentrant {
    _throwIfProtocolPaused();
    require(_getRegistry().isValid(key), "Error: pool not found");

    // @note: do not uncomment the following line
    // Inactive pools permit withdrawals but do not accept deposits or offer rewards.
    // require(_getRegistry().isActive(key), "Error: pool inactive");

    uint256 poolStakedByMe = _getPoolStakedByMe(key, msg.sender);
    uint256 poolStakedByEveryone = _getPoolStakedByEveryone(key);

    require(amount > 0, "Error: invalid amount");
    require(poolStakedByMe >= amount, "Error: insufficient balance");

    require(block.number >= _canWithdrawFrom[key][msg.sender], "Error: too early");

    // First withdraw your rewards
    IGaugeControllerRegistry.PoolSetupArgs memory pool = _withdrawRewards(key);

    IERC20 stakingToken = IERC20(pool.staking.pod);

    poolStakedByMe -= amount;
    poolStakedByEveryone -= amount;

    stakingToken.safeTransfer(msg.sender, amount);

    emit LiquidityGaugeWithdrawn(key, msg.sender, stakingToken, amount);
  }

  function withdrawRewards(bytes32 key) external override nonReentrant returns (IGaugeControllerRegistry.PoolSetupArgs memory) {
    return _withdrawRewards(key);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Getters
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function calculateReward(bytes32 key, address account) external view returns (uint256) {
    IGaugeControllerRegistry.PoolSetupArgs memory pool = _getRegistry().get(key);
    return _calculateReward(pool.staking.ratio, key, account);
  }

  function getTotalBlocksSinceLastReward(bytes32 key, address account) external view override returns (uint256) {
    return _getTotalBlocksSinceLastReward(key, account);
  }

  function getVeNpm() external view override returns (IVoteEscrowToken) {
    return _getVeNpm();
  }

  function getNpm() external view override returns (IERC20) {
    return _npm;
  }

  function getRegistry() external view override returns (IGaugeControllerRegistry) {
    return _getRegistry();
  }

  function getTreasury() external view override returns (address) {
    return _getTreasury();
  }

  function version() external pure override returns (bytes32) {
    return "v0.1";
  }

  function getName() external pure override returns (bytes32) {
    return "Liquidity Gauge Pool";
  }
}
