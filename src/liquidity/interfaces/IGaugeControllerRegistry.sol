// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "../../dependencies/interfaces/IVault.sol";

interface IGaugeControllerRegistry {
  struct PodArgs {
    IVault pod;
    uint256 lockupPeriod;
    uint256 ratio; // Approximate ratio (%) of the POD <--> veNpm for boosted emmission
  }

  struct RewardArgs {
    address token;
    uint256 emissionPerBlock;
    uint256 tokensToDeposit;
  }

  struct PoolSetupArgs {
    string name;
    bytes data;
    uint256 platformFee;
    PodArgs staking;
    RewardArgs npmEmission;
    RewardArgs[] rewards;
  }

  struct KeyValuePair {
    bytes32 key;
    uint256 value;
  }

  function setGauge(uint256 epoch, KeyValuePair[] calldata distribution) external;
  function addPool(bytes32 key, PoolSetupArgs calldata args) external;
  function editPool(bytes32 key, PoolSetupArgs calldata args) external;
  function withdrawRewards(bytes32 key, IERC20 token, uint256 amount) external;
  function deactivatePool(bytes32 key) external;
  function deletePool(bytes32 key) external;

  function isValid(bytes32 key) external view returns (bool);
  function isValidRewardToken(bytes32 key, address rewardToken) external view returns (bool);
  function isActive(bytes32 key) external view returns (bool);
  function get(bytes32 key) external view returns (PoolSetupArgs memory);
  function npmBalanceOf(bytes32 key) external view returns (uint256);
  function sumRewardTokensDeposited(bytes32 key, address token) external view returns (uint256);
  function sumRewardTokensWithdrawn(bytes32 key, address token) external view returns (uint256);
  function getLastEpoch() external view returns (uint256);
  function getAllocation(uint256 epoch, bytes32 key) external view returns (uint256);

  event StakingPoolAdded(address indexed sender, bytes32 indexed key, PoolSetupArgs args);
  event StakingPoolEdited(address indexed sender, bytes32 indexed key, PoolSetupArgs args);
  event StakingPoolDeactivated(address indexed sender, bytes32 indexed key);
  event StakingPoolDeleted(address indexed sender, bytes32 key);
  event GaugeSet(uint256 indexed epoch, KeyValuePair[] distribution);
}
