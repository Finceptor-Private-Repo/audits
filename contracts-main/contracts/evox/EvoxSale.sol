// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "contracts/evox/IEvoxSale.sol";

/**
 * @title EvoxSale
 * @notice The contract for the EVOX sale.
 */
contract EvoxSale is Ownable, IEvoxSale {
    using SafeERC20 for IERC20;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    /// @notice the address of the fund collector
    address public immutable beneficiary;

    /// @notice The pegged token contract address.
    IERC20 public immutable peggedToken;

    /// @notice The NFT contract address that determines allocation.
    IERC721 public immutable evoxNft;

    /// @notice The allocation per NFT token.
    uint256 public allocationPerNFT;

    /// @notice Mapping of deposited values of addresses
    EnumerableMap.AddressToUintMap private _depositBalances;

    /**
     * @notice Constructor of the sale contract.
     * @param _beneficiary The address of the beneficiary.
     * @param _peggedTokenAddress The address of the pegged token.
     * @param _evoxNFTAddress The address of the EVOX NFT contract.
     * @param _allocationPerNFT The allocation per NFT.
     */
    constructor(
        address _beneficiary,
        address _peggedTokenAddress,
        address _evoxNFTAddress,
        uint256 _allocationPerNFT
    ) {
        require(_beneficiary != address(0), "Beneficiary address cannot be 0");
        require(_peggedTokenAddress != address(0), "Pegged token address cannot be 0");
        require(_evoxNFTAddress != address(0), "NFT contract address cannot be 0");
        require(_allocationPerNFT > 0, "Allocation per NFT cannot be 0");

        beneficiary = _beneficiary;
        peggedToken = IERC20(_peggedTokenAddress);
        evoxNft = IERC721(_evoxNFTAddress);
        allocationPerNFT = _allocationPerNFT * (10**6);
    }

    /**
     * @notice Transfers the accidentally sent tokens.
     * @dev This function can only be called by the owner.
     */
    function transferTokens(address _token) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, IERC20(_token).balanceOf(address(this)));
    }

    /**
     * @notice Sets the allocation per NFT.
     * @dev This function can only be called by the owner.
     * @param _perNFTAllocation The allocation per NFT.
     */
    function setAllocationPerNFT(uint256 _perNFTAllocation) external onlyOwner {
        allocationPerNFT = _perNFTAllocation;
    }

    /**
     * @notice See {IEvoxSale-deposit}.
     */
    function deposit(uint256 _amount) external override {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            remainingAllocationOf(msg.sender) >= _amount,
            "Amount must be less than or equal to remaining allocation"
        );

        (bool success, uint256 _deposited) = _depositBalances.tryGet(msg.sender);
        if (success) {
            _depositBalances.set(msg.sender, _deposited + _amount);
        } else {
            _depositBalances.set(msg.sender, _amount);
        }
        peggedToken.safeTransferFrom(msg.sender, beneficiary, _amount);
        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice See {IEvoxSale-depositedOf}.
     */
    function depositedOf(address _user) external view override returns (uint256) {
        (bool success, uint256 _deposited) = _depositBalances.tryGet(_user);
        if (success) {
            return _deposited;
        }
        return 0;
    }

    /**
     * @notice Number of participants in the sale.
     * @return uint256 is the number of participants.
     */
    function participantCount() external view returns (uint256) {
        return _depositBalances.length();
    }

    /**
     * @notice Returns the participant at the given index.
     * @param _index The index of the participant.
     * @return address is the participant address.
     * @return uint256 is the deposited amount.
     */
    function participantAt(uint256 _index) external view returns (address, uint256) {
        require(_index < _depositBalances.length(), "Index out of bounds");
        return _depositBalances.at(_index);
    }

    /**
     * @notice Returns the participants between the given indexes.
     * @param _start The start index of the participants.
     * @param _end The end index of the participants.
     * @return address[] is the array of participant addresses.
     * @return uint256[] is the array of deposited amounts.
     */
    function participantsBetween(uint256 _start, uint256 _end)
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        require(_end > _start, "End must be greater than start");
        require(_end <= _depositBalances.length(), "Index out of bounds");
        uint256 length = _end - _start;
        address[] memory wallets = new address[](_end - _start);
        uint256[] memory balances = new uint256[](_end - _start);
        for (uint256 i = 0; i < length; i++) {
            (address wallet, uint256 balance) = _depositBalances.at(_start + i);
            wallets[i] = wallet;
            balances[i] = balance;
        }
        return (wallets, balances);
    }

    /**
     * @notice See {IEvoxSale-allocationOf}.
     */
    function allocationOf(address _user) public view override returns (uint256) {
        uint256 balance = evoxNft.balanceOf(_user);
        return balance * allocationPerNFT;
    }

    /**
     * @notice See {IEvoxSale-remainingAllocationOf}.
     */
    function remainingAllocationOf(address _user) public view override returns (uint256) {
        uint256 totalAllocation = allocationOf(_user);

        (bool success, uint256 _deposited) = _depositBalances.tryGet(_user);
        if (!success) {
            return totalAllocation;
        } else if (_deposited >= totalAllocation) {
            return 0;
        }
        return totalAllocation - _deposited;
    }
}
