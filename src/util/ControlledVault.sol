// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IControlledVault.sol";
import "./ProtocolMembership.sol";
import "./TokenRecovery.sol";
import "../util/WithPausability.sol";

contract ControlledVault is IControlledVault, ProtocolMembership, Ownable, WithPausability, TokenRecovery {
  using SafeERC20 for IERC20;

  address private _controller;

  constructor(IStore protocolStore, address owner) ProtocolMembership(protocolStore) {
    super.transferOwnership(owner);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                           Controller
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function setController(address controller) public override onlyOwner {
    _throwIfNotProtocolMember(controller);
    _throwIfProtocolPaused();

    emit ControlledVaultInitialized(_controller, controller);

    _controller == controller;
  }

  function getController() public view override returns (address) {
    return _controller;
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                       Internal Functions
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function _deposit(IERC20 token, uint256 amount) internal virtual {
    token.safeTransferFrom(msg.sender, address(this), amount);
    emit ControlledVaultDeposited(msg.sender, token, amount);
  }

  function _withdraw(IERC20 token, uint256 amount) internal virtual {
    token.safeTransfer(msg.sender, amount);
    emit ControlledVaultWithdrawn(msg.sender, token, amount);
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
}
