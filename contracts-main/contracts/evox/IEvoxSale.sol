// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

interface IEvoxSale {
    /**
     * Emitted when a user deposits tokens.
     * @param _user The address of the user.
     * @param _amount The amount of tokens deposited.
     */
    event Deposit(address indexed _user, uint256 _amount);

    /**
     * @notice Get the amount of tokens deposited by NFT holder
     * @param _user The address of the user
     * @return uint256 The amount of tokens deposited
     */
    function depositedOf(address _user) external view returns (uint256);

    /**
     * @notice Get remaining allocation of NFT holder
     * @param _user owner of NFTs
     * @return uint256 remaining allocation of NFTs
     */
    function remainingAllocationOf(address _user) external view returns (uint256);

    /**
     * @notice Get total allocation of NFT holder
     * @param _user owner of NFTs
     * @return uint256 allocation of NFTs
     */
    function allocationOf(address _user) external view returns (uint256);

    /**
     * @notice Deposit pegged tokens to participate in the sale
     * @param _amount The amount of tokens to deposit.
     */
    function deposit(uint256 _amount) external;
}
