// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

interface IAllocationProxy {
    /**
     * @dev Returns total allocation in USD of `_account`
     * @param _account Account to check
     * @return Allocation of `_account`
     */
    function allocationOf(address _account) external view returns (uint256);

    /**
     * @dev Returns credit allocation in USD
     * @return Credit allocation
     */
    function creditAllocationOf(address account) external view returns (uint256);

    /**
     * @dev Returns direct allocation in USD
     * @return Direct allocation
     */
    function directAllocationOf(address account) external view returns (uint256);

    /**
     * @dev Returns relative(staking) allocation in USD
     * @return Relative allocation
     */
    function relativeAllocationOf(address account) external view returns (uint256);

    /**
     * @dev Returns total allocation in USD
     * @return Total allocation
     */
    function totalAllocation() external view returns (uint256);
}
