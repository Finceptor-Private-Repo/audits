// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "contracts/allocation/AbstractAllocationProvider.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title NFTAllocationProvider
 * @author OpenPad
 * @notice grants allocation based on the number of NFTs owned
 */
contract NFTAllocationProvider is AbstractAllocationProvider {
    IERC721 private immutable _nft;
    uint256 private _allocationPerNFT;

    constructor(address nftAddress, uint256 allocationPerNFT) {
        require(nftAddress != address(0), "NFTAllocationProvider: ERC721 address cannot be 0");
        require(allocationPerNFT > 0, "NFTAllocationProvider: allocation per NFT cannot be 0");
        _nft = IERC721(nftAddress);
        _allocationPerNFT = _allocationPerNFT * (10 ** 18);
    }

    function setAllocationPerNFT(uint256 allocationPerNFT) external onlyOwner {
        _allocationPerNFT = allocationPerNFT;
    }

    /**
     * @notice Allocates based on the number of NFTs owned
     * @param account owner of the NFTs
     */
    function _calculateAllocation(address account) internal view override returns (uint256) {
        uint256 nftBalance = _nft.balanceOf(account);
        return nftBalance * _allocationPerNFT;
    }
}
