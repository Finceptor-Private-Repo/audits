// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "contracts/staking/IStaking.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

/**
 * @title StakingCompound
 * @notice Staking contract for Compound
 * @author OpenPad
 */
contract StakingCompound is
    IStaking,
    Ownable,
    Pausable,
    ReentrancyGuard,
    KeeperCompatibleInterface
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    /// @notice The staking token
    IERC20 public immutable token;

    /// @notice The address of the fee recipient
    address private feeRecipient;
    /// @notice The fee for staking
    uint256 private stakeFee;
    /// @notice The fee for withdrawing
    uint256 private withdrawFee;

    /// @notice The reward rate
    uint256 public rewardRate;
    /// @notice The last update time
    uint256 private lastUpdateTime;
    /// @notice The reward per token stored in storage
    uint256 private rewardPerTokenStored;

    /// @notice The address of the wallet that provides rewards
    address private stakingBank;

    /// @notice The total rewards given to users
    mapping(address => uint256) private userRewardPerTokenPaid;
    /// @notice The total rewards generated by users
    mapping(address => uint256) private userTotalRewardsGenerated;
    /// @notice The current rewards generated by users
    mapping(address => uint256) private rewards;

    /// @notice The total staked amount
    uint256 private _totalStaked;
    /// @notice The staked balances of users
    EnumerableMap.AddressToUintMap private _balances;
    /// @notice The time staked of users
    mapping(address => uint256) private _timeStaked;

    // Auto Compounding mechanism variables
    /// @dev The bool to determine if auto compounding is active
    bool private iterationActive = false;
    /// @dev The index of the address to start the audotcompound iteration from
    uint256 private autoCompoundIndex;
    /// @dev The number of addresses to iterate through in each audtocompound iteration
    uint256 private addressCountPerIteartion = 5;

    /**
     * @notice Emitted when audto compound is done on an address
     * @param _from the address of the auto compounded user
     * @param _amount the audot compound amount
     */
    event AutoCompounded(address _from, uint256 _amount);

    /**
     * @notice Emitted when a user stakes, withdraws or claims rewards
     * @dev ifthe address is zero, it means the rewardRate is being updated.
     * @param account the address of the user
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /**
     * @notice The constructor for the StakingCompound contract
     * Sets the stakingToken, stakingBank and rewardRate
     * @param _stakingToken the address of the staking token
     * @param _stakingBank the address of the staking bank
     * @param _rewardRate the reward rate
     */
    constructor(
        address _stakingToken,
        address _stakingBank,
        uint256 _rewardRate
    ) {
        require(_stakingToken != address(0), "Staking token address cannot be 0");
        require(_stakingBank != address(0), "Staking bank address cannot be 0");

        token = IERC20(_stakingToken);
        stakingBank = _stakingBank;
        rewardRate = _rewardRate;
    }

    /**
     * @notice The function to pause staking
     * Can only be called by the owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice The function to unpause staking
     * Can only be called by the owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice The function to update the staking bank
     * Can only be called by the owner
     * @param _stakingBank the address of the new staking bank
     */
    function updateStakingBank(address _stakingBank) external onlyOwner {
        require(_stakingBank != address(0), "StakingCompund: staking bank address cannot be 0");
        stakingBank = _stakingBank;
    }

    function setFeeDetails(
        address _recipient,
        uint256 _stakeFee, //%100
        uint256 _withdrawFee //%100
    ) external onlyOwner {
        require(_recipient != address(0), "StakingCompound: Recipient cannot be the zero address.");
        feeRecipient = _recipient; //@audit-info split to many addresses. Make payment splitter contract
        stakeFee = _stakeFee;
        withdrawFee = _withdrawFee;
    }

    function updateRewardRate(uint256 _rate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rate;
    }

    function updateIterationNumber(uint256 iteration) external onlyOwner {
        addressCountPerIteartion = iteration;
    }

    function stake(uint256 _amount)
        external
        override
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        require(_amount > 0, "StakingCompound: stake amount must be greater than 0.");
        uint256 _feeAmount = (_amount * stakeFee) / 100;

        (bool contains, uint256 balance) = _balances.tryGet(msg.sender);
        if (contains) {
            _balances.set(msg.sender, balance.add(_amount - _feeAmount));
        } else {
            _timeStaked[msg.sender] = block.timestamp;
            _balances.set(msg.sender, _amount - _feeAmount);
        }
        _totalStaked = _totalStaked.add(_amount - _feeAmount);

        token.safeTransferFrom(msg.sender, address(this), _amount);
        if (feeRecipient != address(0)) {
            token.safeTransfer(feeRecipient, _feeAmount);
        }

        emit Staked(msg.sender, _amount - _feeAmount);
    }

    /**
     * @notice Withdraws the specified amount of tokens from the staking contract
     * This function will also decrease the user's total reward generated amount
     * proportional to their withdrawal amount
     * @param _amount is the amount to withdraw
     */
    function withdraw(uint256 _amount) external override nonReentrant updateReward(msg.sender) {
        (bool contains, uint256 balance) = _balances.tryGet(msg.sender);
        require(contains, "Staking: no balance for account");
        require(
            _amount <= balance,
            "Staking: withdraw amount must be less than or equal to balance"
        );
        require(_amount > 0, "Staking: withdraw amount must be greater than 0");

        if (_amount == balance) {
            _balances.remove(msg.sender);
            _timeStaked[msg.sender] = 0;
            userTotalRewardsGenerated[msg.sender] = 0; //@note discussion %75
        } else {
            // Decrease user's total reward amount based on the amount of tokens withdrawn
            uint256 userRewardDecreaseAmount = (userTotalRewardsGenerated[msg.sender] * _amount) /
                balance;

            userTotalRewardsGenerated[msg.sender] -= userRewardDecreaseAmount;
            _balances.set(msg.sender, balance.sub(_amount));
        }
        _totalStaked = _totalStaked.sub(_amount);

        uint256 _feeAmount = (_amount * withdrawFee) / 100;
        token.safeTransfer(msg.sender, _amount - _feeAmount);
        if (feeRecipient != address(0)) {
            token.safeTransfer(feeRecipient, _feeAmount);
        }
        emit Withdrawn(msg.sender, _amount);
    }

    function claimReward() external override nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 rewardAmount = rewards[msg.sender];
        if (rewardAmount > 0) {
            userTotalRewardsGenerated[msg.sender] += rewardAmount;
            rewards[msg.sender] = 0;
            token.safeTransferFrom(stakingBank, msg.sender, rewardAmount);
            emit RewardClaimed(msg.sender, rewardAmount);
        }
    }

    function numberOfParticipants() external view override returns (uint256) {
        return _balances.length();
    }

    function addresses(uint256 _start, uint256 _end)
        external
        view
        override
        returns (address[] memory)
    {
        uint256 length = _end - _start;
        address[] memory _addresses = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            (address user, ) = _balances.at(_start + i);
            _addresses[i] = user;
        }
        return _addresses;
    }

    function stakedOf(address _account) external view override returns (uint256) {
        (bool contains, uint256 balance) = _balances.tryGet(_account);
        if (contains) {
            return balance;
        }
        return 0;
    }

    function rewardOf(address _account) external view override returns (uint256) {
        return earned(_account);
    }

    function totalStaked() external view override returns (uint256) {
        return _totalStaked;
    }

    function getTotalRewardsGenerated(address _address) external view returns (uint256) {
        return userTotalRewardsGenerated[_address] + earned(_address);
    }

    function getTimeStaked(address _address) external view returns (uint256) {
        return _timeStaked[_address];
    }

    function getUserStakeDuration(address _address) external view returns (uint256) {
        if (_timeStaked[_address] == 0) {
            return 0;
        }
        return block.timestamp - _timeStaked[_address];
    }

    function getAPR() external view returns (uint256) {
        //@audit - add apy
        if (_totalStaked == 0) {
            return 0;
        }
        uint256 annualRewardPerToken = rewardRate.mul(365 * 24 * 60 * 60).mul(1e18).div(
            _totalStaked
        );
        uint256 percentage = annualRewardPerToken.mul(100);
        return percentage;
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = iterationActive;
        return (upkeepNeeded, "");
        // We don't use the checkData in this example. The checkData is defined when the Upkeep was registered.
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        //We highly recommend revalidating the upkeep in the performUpkeep function
        if (iterationActive) {
            autoCompound();
        }
        // We don't use the performData in this example. The performData is generated by the Keeper's call to your checkUpkeep function
    }

    function autoCompound() public {
        uint256 usersLeft = _balances.length() - autoCompoundIndex;
        uint256 startIndex = autoCompoundIndex;
        uint256 remaingCount;
        if (usersLeft > addressCountPerIteartion) {
            iterationActive = true;
            autoCompoundIndex = autoCompoundIndex + addressCountPerIteartion;
            remaingCount = addressCountPerIteartion;
        } else {
            iterationActive = false;
            remaingCount = usersLeft;
            autoCompoundIndex = 0;
        }
        for (uint256 i = startIndex; i < startIndex + remaingCount; i++) {
            (address user, ) = _balances.at(i);
            _autoCompound(user);
        }
    }

    function _autoCompound(address _staker) internal whenNotPaused updateReward(_staker) {
        uint256 userReward = earned(_staker); //@audit-issue add require for zero reward to save gas
        if (userReward > 0) {
            rewards[_staker] = 0;
            _totalStaked = _totalStaked.add(userReward);
            _balances.set(_staker, _balances.get(_staker).add(userReward));
            token.safeTransferFrom(stakingBank, address(this), userReward);
            emit AutoCompounded(_staker, userReward);
        }
    }

    function rewardPerToken() private view returns (uint256) {
        if (_totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                (block.timestamp).sub(lastUpdateTime).mul(rewardRate).mul(1e18).div(_totalStaked)
            );
    }

    function earned(address account) private view returns (uint256) {
        (bool contains, uint256 balance) = _balances.tryGet(account);
        if (!contains) {
            return 0;
        }
        return
            balance.mul(rewardPerToken().sub(userRewardPerTokenPaid[account])).div(1e18).add(
                rewards[account]
            );
    }
}
