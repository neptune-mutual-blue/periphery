// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

interface IGaugeControllerRegistry {
  struct StakingArgs {
    address token;
    uint256 lockupPeriodInBlocks;
    uint256 ratio;
  }

  struct PoolSetupArgs {
    string name;
    string info;
    uint256 platformFee;
    StakingArgs staking;
  }

  struct Gauge {
    bytes32 key;
    uint256 emissionPerBlock;
  }

  function addOrEditPool(bytes32 key, PoolSetupArgs calldata args) external;
  function setGauge(uint256 epoch, uint256 amountToDeposit, Gauge[] calldata distribution) external;
  function withdrawRewards(bytes32 key, uint256 amount) external;
  function deactivatePool(bytes32 key) external;
  function activatePool(bytes32 key) external;
  function deletePool(bytes32 key) external;

  function isValid(bytes32 key) external view returns (bool);
  function isActive(bytes32 key) external view returns (bool);
  function get(bytes32 key) external view returns (PoolSetupArgs memory);
  function sumNpmDeposited() external view returns (uint256);
  function sumNpmWithdrawn() external view returns (uint256);
  function getLastEpoch() external view returns (uint256);
  function getEmissionPerBlock(bytes32 key) external view returns (uint256);
  function getAllocation(uint256 epoch) external view returns (uint256);

  event GaugeControllerRegistryOperatorSet(address previousOperator, address operator);
  event GaugeControllerRegistryRewardsWithdrawn(bytes32 key, uint256 amount);
  event GaugeControllerRegistryPoolAddedOrEdited(address indexed sender, bytes32 indexed key, PoolSetupArgs args);
  event GaugeControllerRegistryPoolDeactivated(address indexed sender, bytes32 indexed key);
  event GaugeControllerRegistryPoolActivated(address indexed sender, bytes32 indexed key);
  event GaugeControllerRegistryPoolDeleted(address indexed sender, bytes32 key);
  event GaugeSet(uint256 indexed epoch, uint256 distribution);
  event GaugeAllocationTransferred(uint256 indexed epoch, uint256 totalAllocation);

  error InvalidGaugeEpochError();
  error PoolNotFoundError(bytes32 key);
  error PoolNotActiveError(bytes32 key);
  error PoolDeactivatedError(bytes32 key);
  error PoolAlreadyDeactivatedError(bytes32 key);
  error PoolNotDeactivatedError(bytes32 key);
  error PoolAlreadyActiveError(bytes32 key);
  error PoolAlreadyExistsError(bytes32 key);
  error PlatformFeeTooHighError(bytes32 key, uint256 platformFee);
}
