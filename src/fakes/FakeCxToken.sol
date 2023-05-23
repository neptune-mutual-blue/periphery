// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract FakeCxToken is ERC20Upgradeable {
  function initialize(string memory tokenName, string memory tokenSymbol) public initializer {
    super.__ERC20_init(tokenName, tokenSymbol);
  }

  function mint(address account, uint256 amount) external {
    super._mint(account, amount);
  }

  function expiresOn() external pure returns (uint256) {
    return 1684855021;
  }
}
