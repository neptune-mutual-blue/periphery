// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/IERC1155MetadataURIUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "../../util/WithPausability.sol";
import "../../util/TokenRecovery.sol";
import "./FakeNeptuneLegendsState.sol";

contract FakeNeptuneLegends is AccessControlUpgradeable, ERC1155Upgradeable, ERC2981Upgradeable, WithPausability, TokenRecovery, FakeNeptuneLegendsState {
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    super._disableInitializers();
  }

  function initialize(string calldata tokenUri, address admin, address minter) external initializer {
    super.__AccessControl_init();
    super.__ERC1155_init(tokenUri);
    super.__ERC2981_init();
    super.__Pausable_init();

    _setRoleAdmin(NS_ROLES_MINTER, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_PAUSER, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_ROYALTY_ADMIN, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(NS_ROLES_RECOVERY_AGENT, DEFAULT_ADMIN_ROLE);

    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _setupRole(NS_ROLES_RECOVERY_AGENT, admin);
    _setupRole(NS_ROLES_MINTER, minter);
  }

  function mint(MintInfo calldata info) external override {
    if (_minted[info.id]) {
      revert AlreadyMintedError(info.id);
    }

    _soulbound[info.id] = info.soulbound;
    _minted[info.id] = true;

    if (info.soulbound) {
      emit SoulBound(info.id);
    }

    super._mint(info.sendTo, info.id, 1, "");
  }

  function mintMany(MintInfo[] calldata info) external override {
    for (uint256 i = 0; i < info.length; i++) {
      _soulbound[info[i].id] = info[i].soulbound;

      if (info[i].soulbound) {
        emit SoulBound(info[i].id);
      }

      if (_minted[info[i].id]) {
        revert AlreadyMintedError(info[i].id);
      }

      _minted[info[i].id] = true;
      super._mint(info[i].sendTo, info[i].id, 1, "");
    }
  }

  function setBaseUri(string calldata baseUri) external {
    if (bytes(baseUri).length == 0) {
      revert EmptyArgumentError("baseUri");
    }

    emit BaseUriSet(super.uri(0), baseUri);
    super._setURI(baseUri);
  }

  function setDefaultRoyalty(address receiver, uint96 feeNumerator) external {
    super._setDefaultRoyalty(receiver, feeNumerator);
    emit DefaultRoyaltySet(_msgSender(), receiver, feeNumerator);
  }

  function deleteDefaultRoyalty() external {
    super._deleteDefaultRoyalty();
    emit DefaultRoyaltyDeleted(super._msgSender());
  }

  function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external {
    super._setTokenRoyalty(tokenId, receiver, feeNumerator);
    emit TokenRoyaltySet(super._msgSender(), tokenId, receiver, feeNumerator);
  }

  function resetTokenRoyalty(uint256 tokenId) external {
    super._resetTokenRoyalty(tokenId);
    emit TokenRoyaltyReset(super._msgSender(), tokenId);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                          Recoverable
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function recoverEther(address sendTo) external {
    super._recoverEther(sendTo);
  }

  function recoverToken(IERC20Upgradeable malicious, address sendTo) external {
    super._recoverToken(malicious, sendTo);
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                            Pausable
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function setPausers(address[] calldata accounts, bool[] calldata statuses) external {
    super._setPausers(_pausers, accounts, statuses);
  }

  function pause() external {
    super._pause();
  }

  function unpause() external {
    super._unpause();
  }

  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //                                             Views
  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  function uri(uint256 id) public view override returns (string memory) {
    string memory baseUri = super.uri(id);
    return string(abi.encodePacked(baseUri, StringsUpgradeable.toString(id), ".json"));
  }

  function feeDenominator() external pure returns (uint96) {
    return super._feeDenominator();
  }

  function supportsInterface(bytes4 interfaceId) public pure virtual override(AccessControlUpgradeable, ERC1155Upgradeable, ERC2981Upgradeable) returns (bool) {
    if (type(IAccessControlUpgradeable).interfaceId == interfaceId) {
      return true;
    }

    if (type(IERC1155Upgradeable).interfaceId == interfaceId) {
      return true;
    }

    if (type(ERC2981Upgradeable).interfaceId == interfaceId) {
      return true;
    }

    if (type(IERC1155MetadataURIUpgradeable).interfaceId == interfaceId) {
      return true;
    }

    return false;
  }

  function _throwIfSenderIsNot(bytes32 role) private view {
    if (super.hasRole(role, _msgSender()) == false) {
      revert AccessDeniedError(role);
    }
  }
}
