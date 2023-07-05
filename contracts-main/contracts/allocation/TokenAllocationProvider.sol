// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "contracts/allocation/AbstractAllocationProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenAllocationProvider
 * @author OpenPad
 * @notice grants allocation based on the number of ERC20 tokens owned
 */
contract TokenAllocationProvider is AbstractAllocationProvider {
    IERC20 private immutable _token;

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "TokenAllocationProvider: ERC20 address cannot be 0");
        _token = IERC20(tokenAddress);
    }

    /**
     * @notice Allocates based on the number of ERC20 tokens owned
     * @param account owner of the ERC20 tokens
     */
    function _calculateAllocation(address account) internal view override returns (uint256) {
        return _token.balanceOf(account);
    }
}
