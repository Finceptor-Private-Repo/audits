// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "contracts/allocation/AbstractAllocationProvider.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CreditAllocationProvider
 * @notice Contract that provides an allocation system based on credit token balances
 * @dev This contract is expanded from AbstractAllocationProvider.
 */
contract CreditAllocationProvider is ReentrancyGuard, AbstractAllocationProvider {
    using SafeERC20 for IERC20;

    IERC20 public immutable creditToken;

    constructor(address _creditToken) {
        require(_creditToken != address(0), "Credit token address cannot be 0");
        creditToken = IERC20(_creditToken);
    }

    function _calculateAllocation(address _user) internal view override returns (uint256) {
        return creditToken.balanceOf(_user);
    }
}
