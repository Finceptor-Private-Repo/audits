// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "./IProjectSale.sol";

abstract contract AbstractProjectSale is IProjectSale {
    struct SaleTimes {
        uint256 registerStart;
        uint256 registerEnd;
        uint256 stakingRoundStart;
        uint256 stakingRoundEnd;
        uint256 publicRoundStart;
        uint256 publicRoundEnd;
        uint256 vestingStart;
        uint256 vestingEnd;
    }

    SaleTimes public saleTimes;

    /**
     * @dev Throws if block time isn't between `registerStart` and `registerEnd`
     */
    modifier onlyDuringRegisteration() {
        require(
            block.timestamp >= saleTimes.registerStart,
            "ProjectSale: registration period has not started yet"
        );
        require(block.timestamp <= saleTimes.registerEnd, "ProjectSale: registration period has ended");
        _;
    }

    constructor(
        SaleTimes memory _saleTimes
    ) {
        require(
            _saleTimes.registerStart < _saleTimes.registerEnd,
            "ProjectSale: registerStart must be before registerEnd"
        );
        require(
            _saleTimes.registerEnd <= _saleTimes.stakingRoundStart,
            "ProjectSale: registerEnd must be before stakingRoundStart"
        );
        require(
            _saleTimes.stakingRoundStart < _saleTimes.stakingRoundEnd,
            "ProjectSale: stakingRoundStart must be before stakingRoundEnd"
        );
        require(
            _saleTimes.stakingRoundEnd <= _saleTimes.publicRoundStart,
            "ProjectSale: stakingRoundEnd must be before publicRoundStart"
        );
        require(
            _saleTimes.publicRoundStart < _saleTimes.publicRoundEnd,
            "ProjectSale: publicRoundStart must be before publicRoundEnd"
        );
        require(
            _saleTimes.publicRoundEnd <= _saleTimes.vestingStart,
            "ProjectSale: publicRoundEnd must be before vestingStart"
        );
        require(
            _saleTimes.vestingStart < _saleTimes.vestingEnd,
            "ProjectSale: vestingStart must be before vestingEnd"
        );
        saleTimes = _saleTimes;
    }

    /**
     * @notice Function to update the times after setting.
     * Should have admin role.
     *
     * @param _saleTimes The new sale times
     */
    function updateTimes(
        SaleTimes memory _saleTimes
    ) external virtual;

    /**
     * @dev Returns true if time is between staking round
     * @return True if time is between staking round
     */
    function isStakingRound() public view returns (bool) {
        return block.timestamp >= saleTimes.stakingRoundStart && block.timestamp <= saleTimes.stakingRoundEnd;
    }

    /**
     * @dev Returns true if time is between public round
     * @return True if time is between public round
     */
    function isPublicRound() public view returns (bool) {
        return block.timestamp >= saleTimes.publicRoundStart && block.timestamp <= saleTimes.publicRoundEnd;
    }
}
