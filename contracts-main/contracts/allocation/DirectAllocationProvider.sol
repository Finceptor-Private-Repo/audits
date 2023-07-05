// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "contracts/allocation/AbstractAllocationProvider.sol";

/**
 * @title DirectAllocationProvider
 * @author OpenPad
 */
contract DirectAllocationProvider is AbstractAllocationProvider {

    /**
     * @notice grants allocation to multiple accounts
     * @param accounts accounts to grant allocation to
     * @param allocations allocations to grant
     */
    function grantBatchAllocation(address[] memory accounts, uint256[] memory allocations) external onlyOwner {
        require(accounts.length == allocations.length, "DirectAllocationProvider: accounts and allocations must be the same length");
        for (uint256 i = 0; i < accounts.length; i++) {
            grantAllocation(accounts[i], allocations[i]);
        }
    }

    /**
     * @notice This function is not used in the direct allocation version of allocation provider
     * @param account is the account to calculate in other versions of Allocation providers
     */
    function _calculateAllocation(address account) internal pure override returns (uint256) {
        // ssh - Not used
        account;
        revert("DirectAllocationProvider: cannot calculate allocation on direct allocation provider. Use grantBatchAllocation instead.");
    }
}
