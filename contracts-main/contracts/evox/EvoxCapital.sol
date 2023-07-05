// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EvoxCapital is Ownable, ERC721Enumerable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public maxNFT = 10000;
    uint256 public minPrice = 2 * (10**18);
    uint256 public maxPrice = 100 * (10**18);
    uint256 private newTokenId = 0;
    address payable private manager;

    constructor() ERC721("EvoxCapital", "EvoxCapital") {
        manager = payable(msg.sender);
    }

    receive() external payable nonReentrant {
        if (msg.sender != manager) {
            if (msg.value >= minPrice && msg.value <= maxPrice) {
                //you can use == if you wanna stable nft price!
                for (uint256 i = 0; i < msg.value / (2 * (10**18)); i++) {
                    if (totalSupply() + 1 <= maxNFT) {
                        newTokenId += 1;
                        _safeMint(msg.sender, newTokenId);
                        uint256 balance = address(this).balance;
                        payable(manager).transfer(balance);
                    } else {
                        revert(); //@audit revert without message
                    }
                }
            } else {
                revert(); //@audit revert without message
            }
        }
    }

    function fmint() public onlyOwner { //@audit owner can mint as many free tokens to themselves as they want
        for (uint256 i = 0; i < 50; i++) {
            if (totalSupply() + 1 <= maxNFT) {
                newTokenId += 1;
                _safeMint(msg.sender, newTokenId);
                uint256 balance = address(this).balance;
                payable(manager).transfer(balance);
            } else {
                revert(); //@audit revert without message
            }
        }
    }

    function getNFTzBelongingToOwner(address _owner) external view returns (uint256[] memory) {
        uint256 numNFT = balanceOf(_owner);
        if (numNFT == 0) {
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](numNFT);
            for (uint256 i = 0; i < numNFT; i++) {
                result[i] = tokenOfOwnerByIndex(_owner, i);
            }
            return result;
        }
    }

    string private _baseTokenURI = //@audit this is not a valid URI
        "https://gateway.pinata.cloud/ipfs/QmTLP9BAZEL91XTGY4J4yuhLTSB7uTSLoM4Xy7Ep4GgDKd/new.json";

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) { //@note mmight not be an error, every NFT returns the same metadata
        string memory base = _baseTokenURI;
        string memory _tokenURI = Strings.toString(_tokenId);
        //string memory ending = ".json";
        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        return string(abi.encodePacked(base)); //@audit this is not a valid URI, only returns base
    }

    function setPrice(uint256 newPrice) public onlyOwner {
        minPrice = newPrice;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function withdraw(uint256 _wamount) public onlyOwner {
        //uint balance = address(this).balance; <- this code lines calculate all amount of contract and send this amount entirely to manager
        payable(msg.sender).transfer(_wamount); //@audit unchecked transfer
    }

    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function depositer() public payable returns (uint256) { //@audit redundant function
        require(msg.sender == manager, "only manager can reach  here");
        return address(this).balance;
    }

    function batchTransfer(address recipient, uint256[] memory tokenIds) public {
        for (uint256 index; index < tokenIds.length; index++) {
            transferFrom(msg.sender, recipient, tokenIds[index]);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
