// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

interface IKYCProvider {
    /**
     * @dev Emitted when `_account` is added to whitelist
     */
    event Whitelisted(address indexed _account, uint256 _timestamp);

    /**
     * @dev Emitted when `_account` is removed from whitelist
     */
    event Blacklisted(address indexed _account, uint256 _timestamp);

    /**
     * @dev Returns true if `_account` is KYC approve
     * @param _account Account to check
     */
    function isWhitelisted(address _account) external view returns (bool);

    /**
     * @dev Adds `_account` to whitelist
     * @param _account Account to add to whitelist
     */
    function addToWhitelist(address _account) external;

    /**
     * @dev Adds `_accounts` to whitelist in a single transaction
     */
    function batchAddToWhitelist(address[] memory _accounts) external;

    /**
     * @dev Removes `_account` from whitelist
     * @param _account Account to remove from whitelist
     */
    function removeFromWhitelist(address _account) external;

    /**
     * @dev Removes `_accounts` from whitelist in a single transaction
     * @param _accounts Accounts to remove from whitelist
     */
    function batchRemoveFromWhitelist(address[] memory _accounts) external;
}
