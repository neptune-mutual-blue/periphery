// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "../util/ControlledVault.sol";
import "../dependencies/interfaces/IVault.sol";
import "./interfaces/IGaugeControllerRegistry.sol";

contract GaugeControllerRegistry is IGaugeControllerRegistry, ControlledVault {
  uint256 private constant _DENOMINATOR = 10_000;

  uint256 private _epoch = 0;

  mapping(bytes32 => bool) private _validPools;
  mapping(bytes32 => mapping(address => bool)) private _validRewardTokens;
  mapping(bytes32 => bool) private _activePools;
  mapping(bytes32 => PoolSetupArgs) private _pools;
  mapping(bytes32 => uint256) private _npmBalances;
  mapping(bytes32 => mapping(address => uint256)) private _sumRewardTokenDeposits;
  mapping(bytes32 => mapping(address => uint256)) private _sumRewardTokenWithdrawals;
  mapping(uint256 => mapping(bytes32 => uint256)) private _Gauges;

  constructor(IStore protocolStore, address owner) ControlledVault(protocolStore, owner) {}

  function setGauge(uint256 epoch, KeyValuePair[] calldata distribution) external override onlyOwner {
    require(epoch > 0, "Error: enter epoch value");
    require(epoch == _epoch + 1, "Error: invalid epoch");

    _epoch = epoch;

    uint256 sum = 0;

    for (uint256 i = 0; i < distribution.length; i++) {
      _Gauges[epoch][distribution[i].key] = distribution[i].value;
      sum += distribution[i].value;
    }

    require(sum == _DENOMINATOR, "Error: sum must be 100%");

    emit GaugeSet(epoch, distribution);
  }

  function addPool(bytes32 key, PoolSetupArgs calldata args) external override onlyOwner {
    _throwIfProtocolPaused();

    require(bytes(args.name).length > 0, "Error: invalid pool name");
    require(_validPools[key] == false, "Error: duplicate pool");
    require(address(args.staking.pod) != address(0), "Error: invalid POD contract");

    _validPools[key] = true;
    _activePools[key] = true;

    _pools[key] = args;

    for (uint256 i = 0; i < args.rewards.length; i++) {
      RewardArgs memory reward = args.rewards[i];

      _validRewardTokens[key][reward.token] = true;

      if (reward.tokensToDeposit > 0) {
        super._deposit(IERC20(reward.token), reward.tokensToDeposit);
        _sumRewardTokenDeposits[key][reward.token] = reward.tokensToDeposit;
      }
    }

    if (args.npmEmission.tokensToDeposit > 0) {
      super._deposit(IERC20(args.npmEmission.token), args.npmEmission.tokensToDeposit);

      _npmBalances[key] += args.npmEmission.tokensToDeposit;
    }

    emit StakingPoolAdded(msg.sender, key, args);
  }

  function withdrawRewards(bytes32 key, IERC20 token, uint256 amount) external override onlyController {
    _throwIfProtocolPaused();
    _throwIfNotProtocolMember(msg.sender);

    require(_validRewardTokens[key][address(token)], "Error: invalid reward token");

    _sumRewardTokenWithdrawals[key][address(token)] += amount;

    super._withdraw(token, amount);
    // @todo: emit
  }

  function editPool(bytes32 key, PoolSetupArgs calldata args) external override onlyOwner {
    _throwIfProtocolPaused();
    require(_validPools[key], "Error: pool does not exist");
    // require(_activePools[key], "Error: pool already deactivated");

    if (address(args.staking.pod) != address(0)) {
      require(address(_pools[key].staking.pod) == address(args.staking.pod), "Error: invalid POD contract");
    }

    if (bytes(args.name).length > 0) {
      _pools[key].name = args.name;
    }

    if (args.data.length > 0) {
      _pools[key].data = args.data;
    }

    _pools[key].platformFee = args.platformFee;
    _pools[key].staking.lockupPeriod = args.staking.lockupPeriod;
    _pools[key].npmEmission = args.npmEmission;

    if (args.rewards.length > 0) {
      for (uint256 i = 0; i < args.rewards.length; i++) {
        require(_pools[key].rewards[i].token == args.rewards[i].token, "Error: invalid reward token");

        _validRewardTokens[key][_pools[key].rewards[i].token] = true;

        _pools[key].rewards[i].emissionPerBlock = args.rewards[i].emissionPerBlock;
        _pools[key].rewards[i].tokensToDeposit = args.rewards[i].tokensToDeposit;

        _sumRewardTokenDeposits[key][args.rewards[i].token] += args.rewards[i].tokensToDeposit;

        if (args.rewards[i].tokensToDeposit > 0) {
          super._deposit(IERC20(args.rewards[i].token), args.rewards[i].tokensToDeposit);
        }
      }
    }

    emit StakingPoolEdited(msg.sender, key, args);
  }

  function deactivatePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused();
    require(_validPools[key], "Error: pool does not exist");
    require(_activePools[key], "Error: pool already deactivated");

    _activePools[key] = false;

    emit StakingPoolDeactivated(msg.sender, key);
  }

  function deletePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused();

    require(_validPools[key], "Error: pool does not exist");
    require(_activePools[key] == false, "Error: first deactivat the pool");

    delete _validPools[key];
    delete _pools[key];

    emit StakingPoolDeleted(msg.sender, key);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Modifiers
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  modifier onlyController() {
    require(msg.sender == super.getController(), "Forbidden");
    _;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Getters
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function isValid(bytes32 key) external view override returns (bool) {
    return _validPools[key];
  }

  function isValidRewardToken(bytes32 key, address rewardToken) external view override returns (bool) {
    return _validRewardTokens[key][rewardToken];
  }

  function isActive(bytes32 key) external view override returns (bool) {
    return _activePools[key];
  }

  function get(bytes32 key) external view override returns (PoolSetupArgs memory) {
    return _pools[key];
  }

  function npmBalanceOf(bytes32 key) external view override returns (uint256) {
    return _npmBalances[key];
  }

  function sumRewardTokensDeposited(bytes32 key, address token) external view override returns (uint256) {
    return _sumRewardTokenDeposits[key][token];
  }

  function sumRewardTokensWithdrawn(bytes32 key, address token) external view override returns (uint256) {
    return _sumRewardTokenWithdrawals[key][token];
  }

  function getLastEpoch() external view override returns (uint256) {
    return _epoch;
  }

  function getAllocation(uint256 epoch, bytes32 key) external view override returns (uint256) {
    return _Gauges[epoch][key];
  }
}
