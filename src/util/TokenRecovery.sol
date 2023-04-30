// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract TokenRecovery {
  using SafeERC20 for IERC20;

  function _recoverEther(address sendTo) internal {
    // slither-disable-next-line low-level-calls
    (bool success,) = payable(sendTo).call{value: address(this).balance}(""); // solhint-disable-line avoid-low-level-calls
    require(success, "Recipient may have reverted");
  }

  function _recoverToken(IERC20 malicious, address sendTo) internal {
    malicious.safeTransfer(sendTo, malicious.balanceOf(address(this)));
  }
}
