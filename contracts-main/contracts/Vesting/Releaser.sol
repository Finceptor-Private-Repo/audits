// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Releaser
 */
contract Releaser is Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 private _token;
    uint256 private _erc20Released;
    address private _beneficiary;
    uint256 private _start;
    uint256 private _duration;
    uint256 private _periods;

    event ERC20Released(address _token, uint256 _amount);

    /**
     * @dev Set the beneficiary, start timestamp and vesting duration of the vesting wallet.
     */
    constructor(
        address beneficiaryAddress,
        address erc20Token,
        uint256 startTimestamp,
        uint256 durationSeconds,
        uint256 periodInSeconds
    ) {
        require(erc20Token != address(0), "Releaser: token cannot be the zero address");
        require(beneficiaryAddress != address(0), "Releaser: beneficiary is zero address");
        require(startTimestamp >= block.timestamp, "Releaser: start is before current time");
        require(durationSeconds > 0, "Releaser: duration should be larger than 0");

        _token = IERC20(erc20Token);
        _beneficiary = beneficiaryAddress;
        _start = startTimestamp;
        _duration = durationSeconds;
        _periods = periodInSeconds;
    }

    /**
     * @dev Release the tokens that have already vested.
     *
     * Emits a {ERC20Released} event.
     */
    function release() external virtual {
        uint256 _releasable = vestedAmount(block.timestamp) - released();
        _erc20Released += _releasable;
        emit ERC20Released(ERC20token(), _releasable);
        _token.safeTransfer(beneficiary(), _releasable);
    }

    /**
     * @dev Withdraw the tokens that have already vested.
     * Only in emergency or refund period.
     * @param _amount Amount of tokens to withdraw.
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        _token.safeTransfer(owner(), _amount);
    }

    /**
     * @dev Calculates the amount of tokens that has already vested.
     */
    function vestedAmount(uint256 timestamp) public view virtual returns (uint256) {
        uint256 offset = _start % _periods;
        uint256 residue = (timestamp % _periods);
        uint256 scheduled = timestamp - residue  + offset;
        return _vestingSchedule(_token.balanceOf(address(this)) + released(), scheduled);
    }

    /**
     * @dev Getter for the token address.
     */
    function ERC20token() public view virtual returns (address) {
        return address(_token);
    }

    /**
     * @dev Getter for the beneficiary address.
     */
    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Getter for the start timestamp.
     */
    function start() public view virtual returns (uint256) {
        return _start;
    }

    /**
     * @dev Getter for the vesting duration.
     */
    function duration() public view virtual returns (uint256) {
        return _duration;
    }

    /**
     * @dev Getter for the vesting periods.
     */
    function periods() public view virtual returns (uint256) {
        return _periods;
    }

    /**
     * @dev Amount of token already released
     */
    function released() public view virtual returns (uint256) {
        return _erc20Released;
    }

    function releasable() public view virtual returns (uint256) {
        return vestedAmount(block.timestamp) - released();
    }

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint256 _totalAllocation, uint256 _timestamp) internal view virtual returns (uint256) {
        if (_timestamp < start()) {
            return 0;
        } else if (_timestamp > start() + duration()) {
            return _totalAllocation;
        } else {
            return (_totalAllocation * (_timestamp - start())) / duration();
        }
    }
}
