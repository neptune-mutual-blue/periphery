// Neptune Mutual Protocol (https://neptunemutual.com)
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import "../../dependencies/interfaces/IStore.sol";
import "../../dependencies/interfaces/ICxToken.sol";
import "../../util/interfaces/IThrowable.sol";

abstract contract ProofOfPolicy is IThrowable {
  error InvalidProofError();
  error ExpiredProofError(uint256 expiredOn);

  function _validateProof(IStore s, ICxToken proof, address account) internal view returns (bool) {
    // Ensure that the submitted proof is authentic
    bytes32 key = keccak256(abi.encodePacked("ns:cover:cxtoken", proof));

    if (s.getBool(key) == false) {
      revert AccessDeniedError("cxToken");
    }

    // Ensure that the submitted proof is acceptable
    if (proof.balanceOf((account)) == 0) {
      revert InvalidProofError();
    }

    // Ensure that the submitted proof is active
    if (proof.expiresOn() < block.timestamp) {
      revert ExpiredProofError(proof.expiresOn());
    }

    // Should be valid
    return true;
  }

  function _throwIfInvalidProof(IStore s, ICxToken proof, address account) internal view {
    if (_validateProof(s, proof, account) == false) {
      revert InvalidProofError();
    }
  }
}
