// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";
import "../dependencies/ABDKMath64x64.sol";
import "../util/Store.sol";
import "../util/TokenRecovery.sol";
import "../util/WithPausability.sol";
import "../util/WhitelistedTransfer.sol";
import "./VoteEscrowBooster.sol";
import "./VoteEscrowLocker.sol";

contract VoteEscrowToken is ReentrancyGuard, ERC20, WithPausability, WhitelistedTransfer, TokenRecovery, VoteEscrowBooster, VoteEscrowLocker {
  using SafeERC20 for IERC20;

  IStore public s;
  IERC20 public npm;
  address public feeTo;

  constructor(IStore store, IERC20 npmToken, address feeToAccount, string memory tokenName, string memory tokenSymbol) ERC20(tokenName, tokenSymbol) {
    s = store;
    npm = npmToken;
    feeTo = feeToAccount;

    emit VoteEscrowTokenConstructed(address(store), address(npmToken), feeToAccount, tokenName, tokenSymbol);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                         Lock & Unlock
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _unlockWithPenalty(uint256 penalty) internal {
    uint256 amount = super._unlock(msg.sender, penalty);

    // Pull and burn veNpm
    SafeERC20.safeTransferFrom(this, msg.sender, address(this), super._getLockedTokenBalance(msg.sender));
    super._burn(address(this), amount);

    // Transfer NPM
    npm.safeTransfer(msg.sender, amount - penalty);

    if (penalty > 0) {
      npm.safeTransfer(feeTo, amount - penalty);
    }
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                             Danger!!! External & Public Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function unlock() external override nonReentrant {
    require(super._getUnlockTimestamp(msg.sender) <= block.timestamp, "Error: escrow locked");

    _unlockWithPenalty(0);
  }

  function unlockPrematurely() external override nonReentrant {
    require(super._getUnlockTimestamp(msg.sender) > block.timestamp, "Error: use `unlock` instead");
    require(super._getMinUnlockHeight(msg.sender) < block.number, "Error: rejected");

    uint256 penalty = (super._getLockedTokenBalance(msg.sender) * 2500) / 10_000;
    _unlockWithPenalty(penalty);
  }

  function lock(uint256 amount, uint256 durationInWeeks) external override nonReentrant {
    super._lock(msg.sender, amount, durationInWeeks);

    // Zero value locks signify lock extension
    if (amount > 0) {
      npm.safeTransferFrom(msg.sender, address(this), amount);
      super._mint(msg.sender, amount);
    }
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                             Views
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function getLockedTokenBalance(address account) external view override returns (uint256) {
    return super._getLockedTokenBalance(account);
  }

  function getUnlockTimestamp(address account) external view override returns (uint256) {
    return super._getUnlockTimestamp(account);
  }

  function getMinUnlockHeight(address account) external view override returns (uint256) {
    return super._getMinUnlockHeight(account);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                      Transfer Restriction
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function updateWhitelist(address[] calldata accounts, bool[] memory statuses) external onlyOwner {
    super._updateTransferWhitelist(accounts, statuses);
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override whenNotPaused {
    super._throwIfNonWhitelistedTransfer(s, from, to, amount);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Recoverable
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function recoverEther(address sendTo) external onlyOwner {
    super._recoverEther(sendTo);
  }

  function recoverToken(IERC20 malicious, address sendTo) external onlyOwner {
    super._recoverToken(malicious, sendTo);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Pausable
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function setPausers(address[] calldata accounts, bool[] calldata statuses) external onlyOwner whenNotPaused {
    super._setPausers(accounts, statuses);
  }

  function pause() external onlyPausers {
    super._pause();
  }

  function unpause() external onlyOwner {
    super._unpause();
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                             Boost
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function calculateBoost(uint256 expiryDuration) external pure override returns (uint256) {
    return super._calculateBoost(expiryDuration);
  }

  function getVotingPower(address account) external view override returns (uint256) {
    return super._getVotingPower(super._getLockedTokenBalance(account), super._getUnlockTimestamp(account), block.timestamp);
  }
}
