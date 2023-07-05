// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

interface IAllocationProvider {
    /**
     * @dev Returns allocation in USD of `_account`
     * @param _account Account to check
     * @return Allocation of `_account`
     */
    function allocationOf(address _account) external view returns (uint256);

    /**
     * @dev Returns total allocation in USD
     * @return Total allocation
     */
    function totalAllocation() external view returns (uint256);
}
