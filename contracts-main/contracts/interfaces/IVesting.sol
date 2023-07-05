// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

interface IVesting {
    event Claimed(address account, uint256 amount);
    event Refunded(address account, uint256 amount);

    /**
     * @dev Transfers currently claimable tokens to the sender
     * emits {Claimed} event.
     */
    function claim() external;

    /**
     * @notice Sets `_amount` shares to `_account` independent of their previous shares.
     * @dev Even if `_account` has shares, it will be set to `_amount`.
     * @param _account The account to set shares to
     * @param _amount The amount of shares to set
     */
    function setShares(address _account, uint256 _amount) external;

    /**
     * @notice Adds `_amount` shares to `_account`.
     * @dev If `_account` has no shares, it will be added to the list of shareholders.
     * @param _account The account to add shares to
     * @param _amount The amount of shares to add
     */
    function addShares(address _account, uint256 _amount) external;

    /**
     * @notice Removes `_amount` shares from `_account`.
     * @dev If `_account` has no shares, it will be removed from the list of shareholders.
     * @param _account The account to remove shares from
     */
    function removeShares(address _account) external;

    /**
     * @dev Returns amount of tokens that can be claimed by `_account`
     */
    function claimableOf(address _account) external view returns (uint256);

    /**
     * @dev Returns total amount of tokens that can be claimed by `_account`
     */
    function totalClaimableOf(address _account) external view returns (uint256);

    /**
     * @dev Returns amount of tokens that has been claimed by `_account`
     */
    function claimedOf(address _account) external view returns (uint256);
}
