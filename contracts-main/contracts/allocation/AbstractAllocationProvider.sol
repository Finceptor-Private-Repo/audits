// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "contracts/allocation/IAllocationProvider.sol";

/**
 * @title AbstractAllocationProvider
 * @author OpenPad
 * @notice Contract implments allocation provider interface assuming that
 * {_calculateAllocation} function is implemented.
 * @dev Derived contracts must implement {_calculateAllocation} function.
 */
abstract contract AbstractAllocationProvider is IAllocationProvider, Ownable, ReentrancyGuard {
    struct Allocation {
        uint8 generation;
        uint256 amount;
    }

    /// @notice Mapping of accounts to allocations
    mapping(address => Allocation) private _allocations;
    /// @notice Total allocation reserved
    uint256 private _totalAllocation;
    /// @notice Current generation
    uint8 private _generation = 1;

    function allocationOf(address _account) public view returns (uint256) {
        Allocation memory allocation = _allocations[_account];
        if (allocation.generation == _generation) {
            return allocation.amount;
        }
        return 0;
    }

    function totalAllocation() public view returns (uint256) {
        return _totalAllocation;
    }

    /**
     * @notice Function to grant an allocation to an account
     * @dev This function's behavior can be customized by overriding the internal _grantAllocation function.
     * @param account to grant allocation to
     * @param amount allocation amount
     */
    function grantAllocation(address account, uint256 amount) public onlyOwner {
        require(
            account != address(0),
            "AbstractAllocationProvider: beneficiary is the zero address"
        );
        require(amount > 0, "AbstractAllocationProvider: amount is 0");
        uint allocation = allocationOf(account) + amount;
        _setAllocation(account, allocation);
    }

    function takeSnapshot(
        address[] memory accounts
    ) public onlyOwner nonReentrant {
        for (uint256 i = 0; i < accounts.length; i++) {
            uint256 amount = _calculateAllocation(accounts[i]);
            grantAllocation(accounts[i], amount);
        }
    }

    function reset() public onlyOwner {
        _generation += 1;
        _totalAllocation = 0;
    }

    /**
     * @notice Function to revoke an allocation from an account
     * @dev This function can only be called by the owner.
     * @param account The account to revoke the allocation from
     */
    function revokeAllocation(address account) public onlyOwner {
        require(
            account != address(0),
            "AbstractAllocationProvider: beneficiary is the zero address"
        );
        _setAllocation(account, 0);
    }

    /**
     * @notice Internal function to grant an allocation to an account
     * @dev This function can be overridden to add functionality to the granting of an allocation.
     * @param account The account to grant the allocation to
     */
    function _calculateAllocation(address account) internal view virtual returns (uint256);

    function _setAllocation(address account, uint256 amount) private {
        Allocation memory allocation = _allocations[account];
        if (allocation.generation == _generation) {
            _totalAllocation = _totalAllocation - allocation.amount + amount;
        } else {
            _totalAllocation = _totalAllocation + amount;
        }
        _allocations[account] = Allocation(_generation, amount);
    }
}
