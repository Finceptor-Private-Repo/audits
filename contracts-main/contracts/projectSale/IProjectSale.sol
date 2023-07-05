// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

interface IProjectSale {
    /**
     * @dev Emitted when `_account` registers to sale
     */
    event Registered(address _account);

    /**
     * @dev Emitted when `_account` deposits `_amount` USD pegged coin
     */
    event Deposit(address _account, uint256 _amount);

    /**
     * @dev Register to sale
     *
     * Emits a {Registered} event.
     */
    function register() external;

    /**
     * @dev Returns true if `_account` is registered
     * @param _account Account to check
     */
    function isRegistered(address _account) external view returns (bool);

    /**
     * @dev Returns amount of pegged tokens to be transferred to deposit `_amount` pegged token
     * @param _amount Amount of USD to deposit.
     * @return Amount of pegged tokens to be transferred to deposit `_amount` pegged token
     */
    function depositAmountWithFees(uint256 _amount) external view returns (uint256);

    /**
     * @dev Deposit USD
     * @param _amount Amount of USD to deposit.
     *
     * Emits a {Deposit} event.
     */
    function deposit(uint256 _amount) external;

    /**
     * @dev Deposit credit token
     * @param _amount Amount of credit to deposit.
     *
     * Emits a {Deposit} event.
     */
    function creditDeposit(uint256 _amount) external;

    /**
     * @dev Returns USD deposited by `_account`
     * @param _account Account to check
     */
    function depositedOf(address _account) external view returns (uint256);

    /**
     * @dev Returns credit deposited by `_account`
     * @param _account Account to check
     * @return Credit deposited by `_account`
     */
    function creditDepositedOf(address _account) external view returns (uint256);

    /**
     * @dev Returns depositable USD of `_account`
     * @param _account Account to check
     * @return Depositable USD of `_account`
     */
    function depositableOf(address _account) external view returns (uint256);

    /**
     * @dev Returns credit depositable of an account.
     * @param _account Account to check
     * @return Credit depositable of an account
     */
    function creditDepositableOf(address _account) external view returns (uint256);

    /**
     * @dev Returns current sale value in terms of pegged token
     * @return uint256 current sale value
     */
    function totalSaleValue() external view returns (uint256);

    /**
     * @dev Returns total sale value cap in terms of pegged token
     * @return uint256 total sale value
     */
    function totalSaleValueCap() external view returns (uint256);

    /**
     * @notice Function to view the total public sale deposited of a user
     * @param _account is the address to check.
     * @return uint256 is the total public sale deposited.
     */
    function publicSaleDepositedOf(address _account) external view returns (uint256);

    /**
     * @dev Returns staking round allocation of user, excluding credit token allocation
     * @return uint256 staking round allocation of user
     */
    function stakingRoundAllocationOf(address _account) external view returns (uint256);

    /**
     * @dev Returns credit token allocation of user
     * @return uint256 credit token allocation of user
     */
    function creditAllocationOf(address _account) external view returns (uint256);
}
