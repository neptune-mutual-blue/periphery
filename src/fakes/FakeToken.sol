// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract FakeToken is ERC20 {
  constructor(string memory tokenName, string memory tokenSymbol) ERC20(tokenName, tokenSymbol) {}

  function mint(address account, uint256 amount) external {
    super._mint(account, amount);
  }
}
