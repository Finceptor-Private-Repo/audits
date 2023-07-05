// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/allocation/IAllocationProvider.sol";
import "contracts/kyc/IKYCProvider.sol";
import "contracts/Vesting/Vesting.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "contracts/allocation/IAllocationProxy.sol";
import "contracts/allocation/StakingAllocationProvider.sol";
import "contracts/allocation/CreditAllocationProvider.sol";
import "contracts/allocation/DirectAllocationProvider.sol";
import "contracts/projectSale/AbstractProjectSale.sol";
import "contracts/interfaces/IERC20Burnable.sol";

/**
 * @title ProjectSale contract
 * @author OpenPad
 * @notice This contract is responsible for the sale of a project' tokens.
 * @dev Used with the following contracts:
 * - KYCProvider
 * - SplittedVesting
 * - StakingAllocationProvider
 */
contract ProjectSale is AbstractProjectSale, ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using EnumerableMap for EnumerableMap.AddressToUintMap;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Providers {
        /// @notice External providers for allocation and KYC
        address kycProvider;
        /// @notice allocation provider external contracts
        address allocationProvider;
    }

    struct SaleDetails {
        /// @notice Total value of tokens to be sold
        uint256 totalSaleValueCap;
        /// @notice Price of the project token
        uint256 projectTokenPrice;
        /// @notice Amount of project tokens to be sold
        uint256 projectTokenAmount;
        /// @notice Address to claim deposited funds
        address saleClaimAddress;
        /// @notice Address to claim fees
        address feeClaimAddress;
        /// @notice Total current value of tokens sold
        uint256 totalSaleValue;
        /// @notice Pubic sale deposit cap per user
        uint256 publicSaleDepositCap;
    }

    /**
     * @notice Sale status enum
     * @dev `NOT_FINALIZED` sale has not been finalized yet
     * @dev `FINALIZED` sale has been finalized
     */
    enum SaleStatus {
        NOT_FINALIZED,
        FINALIZED
    }

    bytes32 public constant DEFAULT_ADMIN_ROLE = keccak256("DEFAULT_ADMIN_ROLE");

    /// @notice Sale status
    SaleStatus private _saleStatus;
    /// @notice Fee to be taken on public round deposits
    uint8 private constant PUBLIC_ROUND_FEE = 5; // 5%

    /// @notice External providers for allocation, KYC
    Providers public providers;
    /// @notice Sale details
    SaleDetails public saleDetails;

    /// @notice Splitting vesting contract that handles vesting to multiple users
    Vesting public immutable vestingContract;

    /// @notice Credit reserve address to be used for credit deposits
    address public immutable creditReserve;
    /// @notice Credit token to be used for credit deposits
    IERC20Burnable public immutable creditToken;
    /// @notice USD token to be used for staking and public round deposits
    IERC20 public immutable usdToken;
    /// @notice Project token to be sold
    IERC20 public immutable projectToken;

    /// @notice Address to claim deposited funds
    address public immutable saleClaimAddress;
    /// @notice Address to claim fees
    address public immutable feeClaimAddress;

    /// @notice Mapping of deposited values of addresses
    EnumerableMap.AddressToUintMap private _depositBalances;
    /// @notice Mapping of credit deposited values of addresses
    EnumerableMap.AddressToUintMap private _creditDepositBalances;
    /// @notice Public sale deposit balances
    mapping(address => uint256) private _publicSaleDepositBalances;

    /// @notice Mapping of registered addresses
    EnumerableSet.AddressSet private _participants;

    /**
     * @notice Modifier to check if the address is whitelisted or not
     */
    modifier onlyWhiteListed(address _account) {
        require(
            IKYCProvider(providers.kycProvider).isWhitelisted(_account),
            "ProjectSale: account is not whitelisted"
        );
        _;
    }

    /**
     * @notice Modifier to make sure the `finalizeSale()` function is only being called once.
     */
    modifier onlyOnce() {
        require(_saleStatus == SaleStatus.NOT_FINALIZED, "ProjectSale: sale is finalized");
        _;
        _saleStatus = SaleStatus.FINALIZED;
    }

    /**
     * @notice Constructor for ProjectSale contract that initializes the sale.
     * @param _saleTimes Sale times
     * @param _providers External providers for allocation and KYC
     * @param _vestingPeriodsInSec Vesting periods in seconds
     * @param _creditReserve Address of credit reserve
     * @param _creditToken Address of credit token
     * @param _usdToken Address of USD token
     * @param _projectToken Address of project token
     * @param _projectTokenPrice Price of project token
     * @param _projectTokenAmount Amount of project tokens to be sold
     * @param _totalSaleValueCap Total value of tokens to be sold
     * @param _saleClaimAddress Address to claim deposited funds
     * @param _feeClaimAddress Address to claim fees
     * @dev _projectTokenPrice * _projectTokenAmount == _totalSaleValueCap
     */
    constructor(
        SaleTimes memory _saleTimes,
        Providers memory _providers,
        uint256 _vestingPeriodsInSec,
        address _creditReserve,
        address _creditToken,
        address _usdToken,
        address _projectToken,
        uint256 _projectTokenPrice,
        uint256 _projectTokenAmount,
        uint256 _totalSaleValueCap,
        address _saleClaimAddress,
        address _feeClaimAddress
    ) AbstractProjectSale(_saleTimes) {
        require(
            (_projectTokenPrice * _projectTokenAmount) / (10 ** 18) == _totalSaleValueCap,
            "ProjectSale: invalid sale value"
        );
        require(
            address(_providers.allocationProvider) != address(0),
            "ProjectSale: allocation provider cannot be zero address"
        );
        require(
            address(_providers.kycProvider) != address(0),
            "ProjectSale: kyc provider cannot be zero address"
        );

        // Sale Details
        creditReserve = _creditReserve;
        creditToken = IERC20Burnable(_creditToken);
        usdToken = IERC20(_usdToken);
        projectToken = IERC20(_projectToken);
        saleDetails.totalSaleValueCap = _totalSaleValueCap;
        saleDetails.projectTokenPrice = _projectTokenPrice;
        saleDetails.projectTokenAmount = _projectTokenAmount;
        saleDetails.publicSaleDepositCap = _totalSaleValueCap;
        _saleStatus = SaleStatus.NOT_FINALIZED;

        // External providers for allocation and KYC
        providers = _providers;

        feeClaimAddress = _feeClaimAddress;
        saleClaimAddress = _saleClaimAddress;

        // Create the splitting vesting contract
        uint256 durationInSec = saleTimes.vestingEnd - saleTimes.vestingStart;
        vestingContract = new Vesting(
            address(projectToken),
            saleTimes.vestingStart,
            durationInSec,
            _vestingPeriodsInSec
        );
        vestingContract.grantRole(DEFAULT_ADMIN_ROLE, owner());
    }

    /**
     * @notice Fuction to update sale times.
     * @dev Can only be called by the owner. And when sale is not finalized.
     * @param _saleTimes New sale times.
     */
    function updateTimes(SaleTimes memory _saleTimes) external override onlyOwner {
        require(_saleStatus == SaleStatus.NOT_FINALIZED, "ProjectSale: sale is finalized");
        require(
            _saleTimes.registerStart < _saleTimes.registerEnd &&
                _saleTimes.stakingRoundStart < _saleTimes.stakingRoundEnd &&
                _saleTimes.publicRoundStart < _saleTimes.publicRoundEnd &&
                _saleTimes.vestingStart < _saleTimes.vestingEnd,
            "ProjectSale: invalid time"
        );
        require(
            _saleTimes.registerStart < _saleTimes.stakingRoundStart &&
                _saleTimes.stakingRoundStart < _saleTimes.publicRoundStart &&
                _saleTimes.publicRoundStart < _saleTimes.vestingStart,
            "ProjectSale: invalid time"
        );

        saleTimes = _saleTimes;
    }

    function setPublicSaleCap(uint256 _publicSaleDepositCap) external onlyOwner {
        require(_publicSaleDepositCap > 0, "ProjectSale: cap cannot be zero");
        saleDetails.publicSaleDepositCap = _publicSaleDepositCap;
    }

    /**
     * @notice Registers the sender to the sale.
     * @dev Only allowed during registeration period.
     */
    function register() external override whenNotPaused onlyDuringRegisteration {
        require(!isRegistered(msg.sender), "ProjectSale: already registered");
        _participants.add(msg.sender);
        emit Registered(msg.sender);
    }

    /**
     * @notice Registers the given address to the sale.
     * @dev Only allowed before staking period start and by the contract owner.
     * @param _user Address to be registered.
     */
    function adminRegister(address _user) external onlyOwner whenNotPaused {
        require(
            block.timestamp < saleTimes.stakingRoundStart,
            "ProjectSale: staking round started"
        );
        require(!isRegistered(_user), "ProjectSale: already registered");
        _participants.add(_user);
        emit Registered(_user);
    }

    /**
     * @notice Function to deposit tokens to the sale.
     * Deposits from whitelisted account are allowed
     * if it is during the staking round and the account is registered or
     * if it is during the public round.
     * @dev Also includes depositable amount from credit token,
     * `creditDeposit()` should be used first if user has credit.
     * @param _amount is the amount of tokens to be deposited
     */
    function deposit(
        uint256 _amount
    )
        external
        override
        nonReentrant
        whenNotPaused
        onlyWhiteListed(msg.sender) //@note Give alloc to staker, registers, whitelist ortak kume
    {
        require(_amount > 0, "ProjectSale: amount is zero");
        require(
            (isStakingRound() && isRegistered(msg.sender)) || isPublicRound(),
            "ProjectSale: not allowed to deposit"
        );
        uint256 depositableAmount = depositableOf(msg.sender);

        uint256 fee;
        if (isPublicRound()) {
            require(_publicSaleDepositBalances[msg.sender] + _amount <= saleDetails.publicSaleDepositCap, "ProjectSale: amount exceeds depositable amount");
            if (_amount > depositableAmount) {
                _amount = depositableAmount;
            }
            //@note add investable amount check
            fee = (_amount * PUBLIC_ROUND_FEE) / 100;
            _publicSaleDepositBalances[msg.sender] += _amount;
        } else {
            require(_amount <= depositableAmount, "ProjectSale: amount exceeds depositable amount");
        }

        (bool found, uint256 _deposited) = _depositBalances.tryGet(msg.sender);
        if (found) {
            _depositBalances.set(msg.sender, _deposited + _amount);
        } else {
            _depositBalances.set(msg.sender, _amount);
        }
        vestingContract.addShares(msg.sender, _amount);

        saleDetails.totalSaleValue += _amount;
        usdToken.safeTransferFrom(msg.sender, saleClaimAddress, _amount);
        if (fee > 0) {
            require(
                usdToken.balanceOf(msg.sender) >= fee,
                "ProjectSale: insufficient balance for fee"
            );
            usdToken.safeTransferFrom(msg.sender, feeClaimAddress, fee);
        }
        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice Function to deposit tokens to the sale from credit token.
     * Deposits from whitelisted account are allowed
     * if it is during the staking round and the account is registered.
     * Public round deposit is not allowed.
     * @param _amount is the amount of tokens to be deposited
     */
    function creditDeposit(
        uint256 _amount
    ) external nonReentrant whenNotPaused onlyWhiteListed(msg.sender) {
        require(_amount > 0, "ProjectSale: amount is zero");
        require(
            isStakingRound() && isRegistered(msg.sender),
            "ProjectSale: credit not allowed to deposit"
        );
        uint256 depositableAmount = creditDepositableOf(msg.sender);
        require(_amount <= depositableAmount, "ProjectSale: amount exceeds depositable amount");

        (bool found, uint256 _deposited) = _creditDepositBalances.tryGet(msg.sender);
        if (found) {
            _creditDepositBalances.set(msg.sender, _deposited + _amount);
        } else {
            _creditDepositBalances.set(msg.sender, _amount);
        }
        vestingContract.addShares(msg.sender, _amount);

        saleDetails.totalSaleValue += _amount;
        creditToken.burnFrom(msg.sender, _amount);
        usdToken.safeTransferFrom(creditReserve, saleClaimAddress, _amount);
    }

    /**
     * @notice Function to finalize sale and transfer tokens to Vesting.
     * @dev Only allowed after the sale is over and only once.
     * Only the owner can call this function.
     * The caller must have the tokens to be transferred to vesting.
     */
    function finalizeSale() external onlyOwner onlyOnce {
        require(block.timestamp > saleTimes.publicRoundEnd, "ProjectSale: sale is not over");
        _pause();

        // Transfer the tokens to the vestingContract
        uint256 tokensSold = saleDetails.totalSaleValue.div(saleDetails.projectTokenPrice).mul(10 ** 18);
        projectToken.safeTransferFrom(msg.sender, vestingContract.getReleaser(), tokensSold);
    }

    /**
     * @notice Function to get the total number of participants.
     * @return uint256 is the total number of participants.
     */
    function participantCount() external view returns (uint256) {
        return _participants.length();
    }

    /**
     * @notice Function to get the participant at the given index.
     * @param index is the index of the participant.
     * @return address is the participant.
     */
    function participantAt(uint256 index) external view returns (address) {
        require(index < _participants.length(), "ProjectSale: index out of bounds");
        return _participants.at(index);
    }

    /**
     * @notice Function to get participants between the given indexes.
     * @param start is the start index.
     * @param end is the end index.
     * @return address[] is the array of participants.
     */
    function participantsBetween(
        uint256 start,
        uint256 end
    ) external view returns (address[] memory) {
        require(start <= end, "ProjectSale: start > end");
        require(end <= _participants.length(), "ProjectSale: index out of bounds");
        address[] memory _participantsArray = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            _participantsArray[i - start] = _participants.at(i);
        }
        return _participantsArray;
    }

    /**
     * @notice Function to view the vesting contract address.
     * @dev If the sale is not finalized, the address is zero.
     * @return address is the vesting contract address.
     */
    function getVestingContract() external view returns (address) {
        return address(vestingContract);
    }

    /**
     * @notice Function to view the total sale value
     * @return uint256 is the total sale value.
     */
    function totalSaleValue() external view returns (uint256) {
        return saleDetails.totalSaleValue;
    }

    /**
     * @notice Function to view the total sale value cap
     * @return uint256 is the total sale value cap.
     */
    function totalSaleValueCap() external view returns (uint256) {
        return saleDetails.totalSaleValueCap;
    }

    /**
     * @notice Function to view the total public sale deposited of a user
     * @param _account is the address to check.
     * @return uint256 is the total public sale deposited.
     */
    function publicSaleDepositedOf(address _account) external view returns (uint256) {
        return _publicSaleDepositBalances[_account];
    }

    /**
     * @notice Function to see if an address is registered or not.
     * @param _account is the address to check.
     * @return bool is if the address is registered or not.
     */
    function isRegistered(address _account) public view override returns (bool) {
        return _participants.contains(_account);
    }

    /**
     * @notice Function to see total deposited amount of an address.
     * @param _account is the address to check.
     * @return uint256 is the total deposited amount.
     */
    function depositedOf(address _account) public view override returns (uint256) {
        (bool success, uint256 _deposited) = _depositBalances.tryGet(_account);
        if (success) {
            return _deposited;
        }
        return 0;
    }

    /**
     * @notice Function to see total deposited amount of a user in terms of credit token.
     * @param _account is the address to check.
     * @return uint256 is the total deposited amount in terms of credit token.
     */
    function creditDepositedOf(address _account) public view override returns (uint256) {
        (bool success, uint256 _deposited) = _creditDepositBalances.tryGet(_account);
        if (success) {
            return _deposited;
        }
        return 0;
    }

    /**
     * @notice Function to see remaining depositable amount from direct and staking alloction of an address.
     * @dev If its the public round, every address gets the same amount.
     * @param _account is the address to check.
     * @return uint256 is the remaining depositable amount.
     */
    function depositableOf(address _account) public view override returns (uint256) {
        if (!IKYCProvider(providers.kycProvider).isWhitelisted(_account)) {
            return 0;
        } else if (isRegistered(_account) && isStakingRound()) {
            return stakingRoundAllocationOf(_account);      
        } else if (isPublicRound()) {
            return 
            saleDetails.publicSaleDepositCap - _publicSaleDepositBalances[_account] < saleDetails.totalSaleValueCap - saleDetails.totalSaleValue 
            ? saleDetails.publicSaleDepositCap - _publicSaleDepositBalances[_account] : saleDetails.totalSaleValueCap - saleDetails.totalSaleValue;
        } else {
            return 0;
        }
    }

    /**
     * @notice Function to see remaining depositable amount from credit alloction of an address.
     * @dev Only relevant in the staking round. Returns zero outside of staking round.
     * @param _account is the address to check.
     * @return uint256 is the remaining depositable amount.
     */
    function creditDepositableOf(address _account) public view override returns (uint256) {
        if (!IKYCProvider(providers.kycProvider).isWhitelisted(_account)) {
            return 0;
        } else if (isRegistered(_account) && isStakingRound()) {
            return creditAllocationOf(_account);    
        } else {
            return 0;
        }
    }

    /**
     * @notice Function to see remaining depositable amount from direct and staking alloction of an address.
     * @dev Only relevant in the staking round.
     * @param _account is the address to check.
     * @return uint256 is the remaining depositable amount.
     */
    function stakingRoundAllocationOf(address _account) public view override returns (uint256) {
        return IAllocationProxy(providers.allocationProvider).directAllocationOf(_account) +
                IAllocationProxy(providers.allocationProvider).relativeAllocationOf(_account) -
                depositedOf(_account);
    }

    /**
     * @notice Function to see remaining depositable amount from credit token alllocation of a user.
     * @dev Only relevant in the staking round.
     * @param _account is the address to check.
     * @return uint256 is the remaining depositable amount.
     */
    function creditAllocationOf(address _account) public view override returns (uint256) {
        return IAllocationProxy(providers.allocationProvider).creditAllocationOf(_account) - creditDepositedOf(_account);
    }

    function depositAmountWithFees(uint256 _amount) external view override returns (uint256) {
        if (
            block.timestamp >= saleTimes.publicRoundStart &&
            block.timestamp <= saleTimes.publicRoundEnd
        ) {
            return (_amount * (100 + PUBLIC_ROUND_FEE)) / 100;
        }
        return _amount;
    }
}
