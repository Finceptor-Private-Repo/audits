// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "contracts/staking/IStaking.sol";
import "contracts/allocation/AbstractAllocationProvider.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StakingAllocationProvider
 * @author OpenPad
 * @notice grants allocation based on the amount staked, total rewards generated and stake duration
 * @dev The allocation is calculated as the square root of the sum of the following parameters:
 * - Amount staked
 * - Total rewards generated
 * - Stake duration
 * The parameters are weighted by the following multipliers:
 * - Alfa
 * - Beta
 * - Theta
 * The sum of the multipliers must be 1 ether
 */
contract StakingAllocationProvider is AbstractAllocationProvider {
    using SafeERC20 for IERC20;

    /// @notice Staking contract
    IStaking public immutable _staking;

    /// @notice Alfa parameter used for the multiplier of stake amount
    uint256 private _alfa;
    /// @notice Beta parameter used for the multiplier of total rewards generated
    uint256 private _beta;
    /// @notice Teta parameter used for the multiplier of stake duration
    uint256 private _theta;

    /**
     * @notice Constructor of the contract that initializes:
     * - Staking contract
     * - Credit token contract
     * - Alfa parameter
     * - Beta parameter
     * - Teta parameter
     * @param staking_ Staking contract address
     * @param alfa_ Alfa parameter
     * @param beta_ Beta parameter
     * @param theta_ Teta parameter
     */
    constructor(address staking_, uint256 alfa_, uint256 beta_, uint256 theta_) {
        require(staking_ != address(0), "StakingAllocationProvider: Staking address cannot be 0");
        require(
            alfa_ + beta_ + theta_ == 1 ether,
            "StakingAllocationProvider: Alfa, beta and teta must sum 1 ether"
        );
        _staking = IStaking(staking_);
        _alfa = alfa_;
        _beta = beta_;
        _theta = theta_;
    }

    /**
     * @notice Calculate allocation based on amount staked, total rewards generated and stake duration
     * @param account staker
     */
    function _calculateAllocation(address account) internal view override returns (uint256) {
        uint256 param1 = (_staking.stakedOf(account) * _alfa) / 1e18;
        uint256 param2 = (_staking.getTotalRewardsGenerated(account) * _beta) / 1e18;
        uint256 param3 = (_staking.getUserStakeDuration(account) * _theta);

        uint256 quad = sqrt((param1 + param2 + param3) * 1e18);
        return quad;
    }

    /**
     * @notice Function to calculate the square root of a number.
     * @dev This function is based on the Babylonian method.
     * @param y Number to calculate the square root
     * @return z Square root of the number
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
