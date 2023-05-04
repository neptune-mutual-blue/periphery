// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IGaugeControllerRegistry.sol";
import "../../dependencies/interfaces/IMember.sol";
import "../../escrow/interfaces/IVoteEscrowToken.sol";

interface ILiquidityGaugePool is IMember {
  function intialize(IVoteEscrowToken veNpm, IERC20 npm, IGaugeControllerRegistry registry, address treasury) external;
  function deposit(bytes32 key, uint256 amount) external;
  function withdraw(bytes32 key, uint256 amount) external;
  function withdrawRewards(bytes32 key) external returns (IGaugeControllerRegistry.PoolSetupArgs memory);

  function getVeNpm() external view returns (IVoteEscrowToken);
  function getNpm() external view returns (IERC20);
  function getRegistry() external view returns (IGaugeControllerRegistry);
  function getTreasury() external view returns (address);
  function calculateReward(bytes32 key, address account) external view returns (uint256);
  function getTotalBlocksSinceLastReward(bytes32 key, address account) external view returns (uint256);

  event VotingPowersUpdated(address triggeredBy, uint256 previous, uint256 current, uint256 previousTotal, uint256 currentTotal);
  event LiquidityGaugeRewardsWithdrawn(bytes32 indexed key, address indexed account, address treasury, uint256 rewards, uint256 platformFee);
  event LiquidityGaugeDeposited(bytes32 indexed key, address indexed account, IERC20 indexed stakingToken, uint256 amount);
  event LiquidityGaugeWithdrawn(bytes32 indexed key, address indexed account, IERC20 indexed stakingToken, uint256 amount);
  event LiquidityGaugePoolInitialized(
    IVoteEscrowToken previousVeNpm, IVoteEscrowToken veNpm, IERC20 previousNpm, IERC20 npm, IGaugeControllerRegistry previousRegistry, IGaugeControllerRegistry registry, address previousTreasury, address treasury
  );
}
