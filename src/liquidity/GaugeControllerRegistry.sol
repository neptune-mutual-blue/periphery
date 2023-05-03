// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "../util/ControlledVault.sol";
import "../dependencies/interfaces/IVault.sol";
import "./interfaces/IGaugeControllerRegistry.sol";

contract GaugeControllerRegistry is IGaugeControllerRegistry, ControlledVault {
  using SafeERC20 for IERC20;

  uint256 private constant _DENOMINATOR = 10_000;
  uint256 private _epoch = 0;

  mapping(bytes32 => bool) private _validPools;
  mapping(bytes32 => bool) private _activePools;
  mapping(bytes32 => PoolSetupArgs) private _pools;
  mapping(bytes32 => uint256) private _emissionsPerBlock;
  mapping(uint256 => uint256) private _guageAllocations;

  uint256 private _sumNpmDeposits;
  uint256 private _sumNpmWithdrawals;

  constructor(IStore protocolStore, address owner) ControlledVault(protocolStore, owner) {
    emit GaugeControllerRegistryConstructed(address(protocolStore), owner);
  }

  function setGauge(uint256 epoch, uint256 amountToDeposit, Gauge[] calldata distribution) external override onlyOwner {
    require(epoch > 0, "Error: enter epoch value");
    require(epoch == _epoch + 1, "Error: invalid epoch");

    _epoch = epoch;
    uint256 total = 0;

    for (uint256 i = 0; i < distribution.length; i++) {
      bytes32 key = distribution[i].key;

      require(_validPools[key], "Error: pool invalid");
      require(_activePools[key], "Error: pool deactivated");

      _emissionsPerBlock[key] = distribution[i].emissionPerBlock;
      total += distribution[i].emissionPerBlock;

      emit GaugeSet(epoch, distribution[i].emissionPerBlock);
    }

    require(amountToDeposit >= total, "Error: deposit not enough");

    IERC20 npm = IERC20(super._getNpm());
    npm.safeTransferFrom(msg.sender, address(this), amountToDeposit);

    _guageAllocations[epoch] = amountToDeposit;
    _sumNpmDeposits += amountToDeposit;

    emit GaugeAllocationTransferred(epoch, amountToDeposit);
  }

  function addOrEditPool(bytes32 key, PoolSetupArgs calldata args) external override onlyOwner {
    _throwIfProtocolPaused();

    bool adding = _validPools[key] == false;

    if (adding) {
      require(bytes(args.name).length > 0, "Error: invalid pool name");
      require(_validPools[key] == false, "Error: duplicate pool");
      require(address(args.staking.pod) != address(0), "Error: invalid POD contract");

      _validPools[key] = true;
      _activePools[key] = true;

      _pools[key] = args;
    } else {
      require(_validPools[key], "Error: invalid pool");
      require(_activePools[key], "Error: pool deactivated");

      if (bytes(args.name).length > 0) {
        _pools[key].name = args.name;
      }

      _pools[key].platformFee = args.platformFee;
    }

    emit GaugeControllerRegistryPoolAddedOrEdited(msg.sender, key, args);
  }

  function withdrawRewards(bytes32 key, uint256 amount) external override onlyController {
    _throwIfProtocolPaused();
    _throwIfNotProtocolMember(msg.sender);

    IERC20 npm = IERC20(super._getNpm());

    _sumNpmWithdrawals += amount;

    super._withdraw(npm, amount);
    emit GaugeControllerRegistryRewardsWithdrawn(key, amount);
  }

  function deactivatePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused();
    require(_validPools[key], "Error: pool does not exist");
    require(_activePools[key], "Error: pool already deactivated");

    _activePools[key] = false;

    emit GaugeControllerRegistryPoolDeactivated(msg.sender, key);
  }

  function activatePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused();
    require(_validPools[key], "Error: pool does not exist");
    require(_activePools[key] == false, "Error: pool not deactivated");

    _activePools[key] = true;

    emit GaugeControllerRegistryPoolActivated(msg.sender, key);
  }

  function deletePool(bytes32 key) external override onlyOwner {
    _throwIfProtocolPaused();

    require(_validPools[key], "Error: pool does not exist");
    require(_activePools[key] == false, "Error: first deactivate the pool");

    delete _validPools[key];
    delete _pools[key];

    emit GaugeControllerRegistryPoolDeleted(msg.sender, key);
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

  function isActive(bytes32 key) external view override returns (bool) {
    return _activePools[key];
  }

  function get(bytes32 key) external view override returns (PoolSetupArgs memory) {
    return _pools[key];
  }

  function sumNpmDeposited() external view override returns (uint256) {
    return _sumNpmDeposits;
  }

  function sumNpmWithdrawn() external view override returns (uint256) {
    return _sumNpmWithdrawals;
  }

  function getLastEpoch() external view override returns (uint256) {
    return _epoch;
  }

  function getAllocation(uint256 epoch) external view override returns (uint256) {
    return _guageAllocations[epoch];
  }

  function getEmissionPerBlock(bytes32 key) external view override returns (uint256) {
    return _emissionsPerBlock[key];
  }
}
