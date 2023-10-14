// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../../util/interfaces/IThrowable.sol";
import "./FakeLiquidityGaugePoolStateV2.sol";

abstract contract FakeLiquidityGaugePoolControllerV2 is IThrowable, AccessControlUpgradeable, FakeLiquidityGaugePoolStateV2 {
  modifier onlyRegistry() {
    if (_msgSender() != _registry) {
      revert AccessDeniedError("Registry");
    }

    _;
  }

  function _setPool(PoolInfo calldata args) internal {
    if (bytes(args.name).length == 0) {
      revert InvalidArgumentError("args.name");
    }

    if (bytes(args.info).length == 0) {
      revert InvalidArgumentError("args.info");
    }

    if (args.epochDuration == 0) {
      revert InvalidArgumentError("args.epochDuration");
    }

    if (args.veBoostRatio == 0) {
      revert InvalidArgumentError("args.veBoostRatio");
    }

    if (args.treasury == address(0)) {
      revert InvalidArgumentError("args.treasury");
    }

    if (args.platformFee > _MAX_PLATFORM_FEE) {
      revert InvalidArgumentError("args.platformFee");
    }
    
    _poolInfo = args;

    emit LiquidityGaugePoolSet(_key, _msgSender(), address(this), args);
  }

  function _setEpochDuration(uint256 epochDuration) internal {
    emit EpochDurationUpdated(_key, _poolInfo.epochDuration, epochDuration);

    _poolInfo.epochDuration = epochDuration;
  }
}