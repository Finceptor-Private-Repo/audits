// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "contracts/interfaces/IVesting.sol";
import "contracts/Vesting/Releaser.sol";

/**
 * @title Vesting
 */
contract Vesting is IVesting, Pausable, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bool public isRefundOpen;

    bytes32 public constant PROJECT_SALE = keccak256("PROJECT_SALE");

    Releaser private releaser;
    IERC20 private token;

    uint256 private _totalShares;
    uint256 private _totalReleased;

    mapping(address => uint256) private _shares;
    mapping(address => uint256) private _released;
    address[] private _payees;

    event SharesAdded(address account, uint256 amount);
    event SharesUpdated(address account, uint256 newShares);
    event PaymentReleased(address to, uint256 amount);

    modifier onlyInRefundPeriod() {
        require(isRefundOpen, "Refund is not open");
        _;
    }

    constructor(
        address _token,
        uint256 _cliff,
        uint256 _durationInSec,
        uint256 _periodInSeconds
    ) {
        require(_token != address(0), "Token address cannot be 0");
        require(_cliff >= block.timestamp, "Cliff cannot be in the past");
        require(_durationInSec > 0, "Duration cannot be 0");

        releaser = new Releaser(address(this), _token, _cliff, _durationInSec, _periodInSeconds);
        token = IERC20(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROJECT_SALE, msg.sender);
        isRefundOpen = false;
    }

    /**
     * @dev See {IVesting-claim}.
     */
    function claim() external nonReentrant whenNotPaused {
        releaser.release();
        uint256 payment = releasable(msg.sender);
        _release(msg.sender);
        emit Claimed(msg.sender, payment);
    }

    function refundUser(address _account) public onlyInRefundPeriod onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 notClaimed = totalClaimableOf(_account) - claimedOf(_account);
        releaser.release();
        uint256 payment = releasable(_account);
        _removeShares(_account);
        releaser.emergencyWithdraw(notClaimed - payment);
        token.safeTransfer(msg.sender, notClaimed);
        emit Refunded(_account, notClaimed);
    }

    // ACCESS CONTROL FUNCTIONS

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function allowRefund() external onlyRole(DEFAULT_ADMIN_ROLE) {
        isRefundOpen = true;
    }

    function disallowRefund() external onlyRole(DEFAULT_ADMIN_ROLE) {
        isRefundOpen = false;
    }

    /**
     * @dev See {IVesting-setShares}.
     */
    function setShares(address _account, uint256 shares_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_account != address(0), "Vesting: account is the zero address");
        require(shares_ > 0, "Vesting: shares are 0");

        uint256 oldShares = _shares[_account]; 
        _shares[_account] = shares_;
        _totalShares = _totalShares + shares_ - oldShares;
        emit SharesUpdated(_account, shares_);
    }

    /**
     * @dev See {IVesting-addShares}.
     */
    function addShares(address _account, uint256 _amount) external onlyRole(PROJECT_SALE) {
        require(_account != address(0), "Vesting: account is the zero address");
        require(_amount > 0, "Vesting: shares are 0");

        _shares[_account] += _amount;
        _totalShares += _amount;
        emit SharesAdded(_account, _amount);
    }

    /**
     * @dev See {IVesting-removeShares}.
     */
    function removeShares(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _removeShares(_account);
    }

    /**
     * @dev See {IVesting-claimableOf}.
     */
    function claimableOf(address _account) external view returns (uint256) {
        return releasable(_account);
    }

    /**
     * @dev Function to get the vesting releaser contract.
     * @return address of the releaser contract.
     */
    function getReleaser() external view returns (address) {
        return address(releaser);
    }

    /**
     * @dev Function to get the vesting token contract.
     * @return address of the token contract.
     */
    function getTokenAddress() external view returns (address) {
        return address(token);
    }

    /**
     * @dev Getter for the amount of shares held by an account.
     */
    function shares(address account) external view returns (uint256) {
        return _shares[account];
    }

    /**
     * @dev See {IVesting-totalClaimableOf}.
     */
    function totalClaimableOf(address _account) public view returns (uint256) {
        uint256 vestingEnd = releaser.start() + releaser.duration();
        uint256 saleAmount = releaser.vestedAmount(vestingEnd);
        return _shareOf(_account, saleAmount);
    }

    /**
     * @dev See {IVesting-claimedOf}.
     */
    function claimedOf(address _account) public view returns (uint256) {
        return _released[_account];
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of `token` tokens they are owed, according to their
     * percentage of the total shares and their previous withdrawals. `token` must be the address of an IERC20
     * contract.
     */
    function _release(address account) internal virtual {
        require(_shares[account] > 0, "Vesting: account has no shares");

        uint256 payment = releasable(account);

        require(payment != 0, "Vesting: account is not due payment");

        _released[account] += payment;
        _totalReleased += payment;

        token.safeTransfer(account, payment);
        emit PaymentReleased(account, payment);
    }

    function _removeShares(address _account) internal {
        require(_account != address(0), "Vesting: account is the zero address");

        uint256 oldShares = _shares[_account];
        _shares[_account] = 0;
        _totalShares -= oldShares;
        emit SharesUpdated(_account, 0);
    }

    /**
     * @dev Getter for the amount of shares in tokens with respect to total amounts.
     * @param _account address of the account.
     * @param _amount amount of total tokens.
     * @return amount of tokens account can receive.
     */
    function _shareOf(address _account, uint256 _amount) internal view returns (uint256) {
        return (_amount * _shares[_account]) / _totalShares;
    }

    /**
     * @dev Getter for the amount of payee's releasable `token` tokens. `token` should be the address of an
     * IERC20 contract.
     */
    function releasable(address account) internal view returns (uint256) {
        uint256 totalReceived = token.balanceOf(address(this)) + _totalReleased + releaser.releasable();
        return _pendingPayment(account, totalReceived, _released[account]);
    }

    /**
     * @dev internal logic for computing the pending payment of an `account` given the token historical balances and
     * already released amounts.
     */
    function _pendingPayment(
        address account,
        uint256 totalReceived,
        uint256 alreadyReleased
    ) private view returns (uint256) {
        return (totalReceived * _shares[account]) / _totalShares - alreadyReleased;
    }
}
