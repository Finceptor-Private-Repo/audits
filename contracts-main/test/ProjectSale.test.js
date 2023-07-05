const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
    loadFixture,
    time,
} = require("@nomicfoundation/hardhat-network-helpers");

async function returnTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return Math.round(blockBefore.timestamp);
}

describe("OPN Project Sale Contract", function () {
    async function deployModifyEnvironment() {
        const [
            owner,
            feeClaimer,
            addr1,
            addr2,
            addr3,
            addr4,
            addr5,
            addr6,
            addr7,
            addr8,
            addr9,
            addr10,
        ] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("OpenPad");
        const opnToken = await Token.deploy();
        await opnToken.deployed();

        const decimals = await opnToken.decimals();
        const mintAmountOwner = 1000;
        const mintAmount = 100;
        const mintAmountS = ethers.utils.parseUnits(
            mintAmount.toString(),
            decimals
        );
        const rewardRate = 10000;

        await opnToken.batchMint(
            [
                addr1.address,
                addr2.address,
                addr3.address,
                addr4.address,
                addr5.address,
                addr6.address,
                addr7.address,
                addr8.address,
                addr9.address,
                addr10.address,
            ],
            [
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
            ]
        );
        await opnToken.mint(
            owner.address,
            ethers.utils.parseUnits(mintAmountOwner.toString(), decimals)
        );

        // Deploy credit token
        const CreditToken = await ethers.getContractFactory("OpenpadCreditToken");
        const creditToken = await CreditToken.deploy();
        await creditToken.deployed();

        await creditToken.mint(addr1.address, ethers.utils.parseUnits("1", 18));
        await creditToken.mint(addr2.address, ethers.utils.parseUnits("2", 18));
        await creditToken.mint(addr3.address, ethers.utils.parseUnits("3", 18));
        await creditToken.mint(addr4.address, ethers.utils.parseUnits("4", 18));
        await creditToken.mint(addr5.address, ethers.utils.parseUnits("5", 18));
        await creditToken.mint(addr6.address, ethers.utils.parseUnits("6", 18));
        await creditToken.mint(addr7.address, ethers.utils.parseUnits("7", 18));
        await creditToken.mint(addr8.address, ethers.utils.parseUnits("8", 18));
        await creditToken.mint(addr9.address, ethers.utils.parseUnits("9", 18));
        await creditToken.mint(addr10.address, ethers.utils.parseUnits("10", 18));

        // Deploy mock BUSD fot investment
        const BUSDTokenMock = await ethers.getContractFactory("BinanceUSD");
        const busd = await BUSDTokenMock.deploy();
        await busd.deployed();

        const decimalsbusd = await busd.decimals();
        const mintAmountbusd = 1000;
        const mintAmountSbusd = ethers.utils.parseUnits(
            mintAmountbusd.toString(),
            decimalsbusd
        );

        await busd.batchMint(
            [
                addr1.address,
                addr2.address,
                addr3.address,
                addr4.address,
                addr5.address,
                addr6.address,
                addr7.address,
                addr8.address,
                addr9.address,
                addr10.address,
            ],
            [
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
                mintAmountSbusd,
            ]
        );

        // Deploy mock project token fot investment
        const ProjectTokenMock = await ethers.getContractFactory("DemoToken");
        const projectToken = await ProjectTokenMock.deploy();
        await projectToken.deployed();

        const decimalsProjectToken = await projectToken.decimals();
        const mintAmountProjectToken = 1000000;
        const mintAmountSProjectToken = ethers.utils.parseUnits(
            mintAmountProjectToken.toString(),
            decimalsProjectToken
        );

        await projectToken.mint(owner.address, mintAmountSProjectToken);

        const StakingCompound = await ethers.getContractFactory(
            "StakingCompound"
        );

        const stakingContract = await StakingCompound.deploy(
            opnToken.address,
            owner.address,
            rewardRate
        );
        await stakingContract.deployed();

        await opnToken.approve(
            stakingContract.address,
            ethers.utils.parseUnits(mintAmount.toString(), decimals)
        );
        await opnToken
            .connect(addr1)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr2)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr3)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr4)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr5)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr6)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr7)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr8)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr9)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr10)
            .approve(stakingContract.address, mintAmountS);

        await stakingContract.connect(addr1).stake(mintAmountS);
        await stakingContract.connect(addr2).stake(mintAmountS);
        await stakingContract.connect(addr3).stake(mintAmountS);
        await stakingContract.connect(addr4).stake(mintAmountS);
        await stakingContract.connect(addr5).stake(mintAmountS);
        await stakingContract.connect(addr6).stake(mintAmountS);
        await stakingContract.connect(addr7).stake(mintAmountS);
        await stakingContract.connect(addr8).stake(mintAmountS);
        await stakingContract.connect(addr9).stake(mintAmountS);
        await stakingContract.connect(addr10).stake(mintAmountS);

        await time.increase(1000);
        await stakingContract.autoCompound();
        condition = await stakingContract.checkUpkeep(0x00);
        while (condition[0]) {
            await stakingContract.performUpkeep(0x00);
            condition = await stakingContract.checkUpkeep(0x00);
        }

        await time.increase(1000);
        await stakingContract.autoCompound();
        condition = await stakingContract.checkUpkeep(0x00);
        while (condition[0]) {
            await stakingContract.performUpkeep(0x00);
            condition = await stakingContract.checkUpkeep(0x00);
        }

        await time.increase(1000);

        const KycProvider = await ethers.getContractFactory("BasicKYCProvider");
        const kycProvider = await KycProvider.deploy();
        await kycProvider.deployed();

        await kycProvider.batchAddToWhitelist([
            addr1.address,
            addr2.address,
            addr3.address,
            addr4.address,
            addr5.address,
            addr6.address,
            addr7.address,
            addr8.address,
            addr9.address,
            //addr10.address, address 10 is not whitelisted
        ]);

        const alfa = ethers.utils.parseUnits("0.7", 18);
        const beta = ethers.utils.parseUnits("0.3", 18);
        //const teta = ethers.utils.parseUnits("0.1", 18);
        const teta = 0;

        const StakingAllocationProvider = await ethers.getContractFactory(
            "StakingAllocationProvider"
        );
        const DirectAllocationProvider = await ethers.getContractFactory("DirectAllocationProvider");
        const TokenAllocationProvider = await ethers.getContractFactory("TokenAllocationProvider");
        const AllocationProxy = await ethers.getContractFactory("AllocationProxy");


        const stakingAllocation = await StakingAllocationProvider.deploy(
            stakingContract.address,
            alfa,
            beta,
            teta
        );
        await stakingAllocation.deployed();

        const directAllocation = await DirectAllocationProvider.deploy();
        await directAllocation.deployed();

        const tokenAllocation = await TokenAllocationProvider.deploy(creditToken.address);
        await tokenAllocation.deployed();

        await stakingAllocation.takeSnapshot([
            addr1.address,
            addr2.address,
            addr3.address,
            addr4.address,
            addr5.address,
            addr6.address,
            addr7.address,
            addr8.address,
            addr9.address,
            addr10.address,
        ]);

        await directAllocation.grantBatchAllocation(
            [
                addr1.address,
                addr2.address,
                addr3.address,
                addr4.address,
                addr5.address,
                addr6.address,
                addr7.address,
                addr8.address,
                addr9.address,
                addr10.address
            ],
            [
                ethers.utils.parseUnits("1", 18),
                ethers.utils.parseUnits("2", 18),
                ethers.utils.parseUnits("3", 18),
                ethers.utils.parseUnits("4", 18),
                ethers.utils.parseUnits("5", 18),
                ethers.utils.parseUnits("6", 18),
                ethers.utils.parseUnits("7", 18),
                ethers.utils.parseUnits("8", 18),
                ethers.utils.parseUnits("9", 18),
                ethers.utils.parseUnits("10", 18),
            ]);

        await tokenAllocation.takeSnapshot([
            addr1.address,
            addr2.address,
            addr3.address,
            addr4.address,
            addr5.address,
            addr6.address,
            addr7.address,
            addr8.address,
            addr9.address,
            addr10.address
        ]);

        const currentTime = await returnTimestamp();                                                                

        const _registerStart = currentTime + 1000;
        const _registerEnd = currentTime + 2000;
        const _stakingRoundStart = currentTime + 3000;
        const _stakingRoundEnd = currentTime + 4000;
        const _publicRoundStart = currentTime + 5000;
        const _publicRoundEnd = currentTime + 6000;
        const _vestingStart = currentTime + 7000;
        const _vestingEnd = currentTime + 8000;
        const _vestingPeriod = "1";
        const _kycProvider = kycProvider.address;
        const _creditReserve = owner.address;
        const _creditToken = creditToken.address;
        const _usdToken = busd.address;
        const _projectToken = projectToken.address;
        const _projectTokenPrice = ethers.utils.parseUnits("0.1", 18);
        const _projectTokenAmount = ethers.utils.parseUnits("10000", 18);
        const _totalSaleValueCap = ethers.utils.parseUnits("1000", 18);
        const _saleClaimAddress = owner.address;
        const _feeClaimAddres = feeClaimer.address;

        const allocationProxy = await AllocationProxy.deploy(
            tokenAllocation.address, 
            directAllocation.address, 
            stakingAllocation.address, 
            _totalSaleValueCap
        );
        await allocationProxy.deployed();

        const _allocationProvider = allocationProxy.address;

        // Deploy ProjectSale with busd, project Token, and stakingAllocation.
        const ProjectSale = await ethers.getContractFactory("ProjectSale");

        const _times = {
            registerStart: _registerStart,
            registerEnd: _registerEnd,
            stakingRoundStart: _stakingRoundStart,
            stakingRoundEnd: _stakingRoundEnd,
            publicRoundStart: _publicRoundStart,
            publicRoundEnd: _publicRoundEnd,
            vestingStart: _vestingStart,
            vestingEnd: _vestingEnd,
        };

        const _providers = {
            kycProvider: _kycProvider,
            allocationProvider: _allocationProvider,
        };

        const projectSale = await ProjectSale.deploy(
            _times,
            _providers,
            _vestingPeriod,
            _creditReserve,
            _creditToken,
            _usdToken,
            _projectToken,
            _projectTokenPrice,
            _projectTokenAmount,
            _totalSaleValueCap,
            _saleClaimAddress,
            _feeClaimAddres
        );
        await projectSale.deployed();

        await busd.connect(addr1).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr2).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr3).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr4).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr5).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr6).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr7).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr8).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr9).approve(projectSale.address, mintAmountSbusd);
        await busd.connect(addr10).approve(projectSale.address, mintAmountSbusd);

        return {
            projectSale,
            Token,
            StakingCompound,
            opnToken,
            stakingContract,
            allocationProxy,
            kycProvider,
            rewardRate,
            busd,
            projectToken,
            owner,
            feeClaimer,
            creditToken,
            addr1,
            addr2,
            addr3,
            addr4,
            addr5,
            addr6,
            addr7,
            addr8,
            addr9,
            addr10,
        };
    }

    describe("Project Sale Flow", function () {
        it("Configure the Sale: Should revert in constructor on wrong parameters", async function () {
            const {
                busd,
                allocationProxy,
                kycProvider,
                owner,
                projectToken,
                feeClaimer,
                creditToken,
            } = await loadFixture(deployModifyEnvironment);

            const currentTime = await returnTimestamp();                                                                

            const _registerStart = currentTime + 1000;
            const _registerEnd = currentTime + 2000;
            const _stakingRoundStart = currentTime + 3000;
            const _stakingRoundEnd = currentTime + 4000;
            const _publicRoundStart = currentTime + 5000;
            const _publicRoundEnd = currentTime + 6000;
            const _vestingStart = currentTime + 7000;
            const _vestingEnd = currentTime + 8000;
            const _vestingPeriod = "1";
            const _creditReserve = owner.address;
            const _usdToken = busd.address;
            const _projectToken = projectToken.address;
            const _projectTokenPrice = ethers.utils.parseUnits("0.1", 18);
            const _projectTokenAmount = ethers.utils.parseUnits("10000", 18);
            const _totalSaleValueCap = ethers.utils.parseUnits("1000", 18);
            const _totalSaleValueCapError = ethers.utils.parseUnits("2000", 18);
            const _saleClaimAddress = owner.address;
            const _feeClaimAddres = feeClaimer.address;

            const ProjectSale = await ethers.getContractFactory("ProjectSale");

            const _times = {
                registerStart: _registerStart,
                registerEnd: _registerEnd,
                stakingRoundStart: _stakingRoundStart,
                stakingRoundEnd: _stakingRoundEnd,
                publicRoundStart: _publicRoundStart,
                publicRoundEnd: _publicRoundEnd,
                vestingStart: _vestingStart,
                vestingEnd: _vestingEnd,
            };

            const _timesError = {
                registerStart: _registerStart + 1200,
                registerEnd: _registerEnd,
                stakingRoundStart: _stakingRoundStart,
                stakingRoundEnd: _stakingRoundEnd,
                publicRoundStart: _publicRoundStart,
                publicRoundEnd: _publicRoundEnd,
                vestingStart: _vestingStart,
                vestingEnd: _vestingEnd,
            };
    
            const _providersError = {
                kycProvider: "0x0000000000000000000000000000000000000000",
                allocationProvider: allocationProxy.address,
            };

            const _providersError2 = {
                kycProvider: kycProvider.address,
                allocationProvider: "0x0000000000000000000000000000000000000000",
            };

            const _providers = {
                kycProvider: kycProvider.address,
                allocationProvider: allocationProxy.address,
            };

            projectSale = await expect(ProjectSale.deploy(
                _times,
                _providersError,
                _vestingPeriod,
                _creditReserve,
                creditToken.address,
                _usdToken,
                _projectToken,
                _projectTokenPrice,
                _projectTokenAmount,
                _totalSaleValueCap,
                _saleClaimAddress,
                _feeClaimAddres
            )).to.be.revertedWith("ProjectSale: kyc provider cannot be zero address");
    
            projectSale = await expect(ProjectSale.deploy(
                _times,
                _providersError2,
                _vestingPeriod,
                _creditReserve,
                creditToken.address,
                _usdToken,
                _projectToken,
                _projectTokenPrice,
                _projectTokenAmount,
                _totalSaleValueCap,
                _saleClaimAddress,
                _feeClaimAddres
            )).to.be.revertedWith("ProjectSale: allocation provider cannot be zero address");

            projectSale = await expect(ProjectSale.deploy(
                _timesError,
                _providers,
                _vestingPeriod,
                _creditReserve,
                creditToken.address,
                _usdToken,
                _projectToken,
                _projectTokenPrice,
                _projectTokenAmount,
                _totalSaleValueCap,
                _saleClaimAddress,
                _feeClaimAddres
            )).to.be.revertedWith("ProjectSale: registerStart must be before registerEnd");

            projectSale = await expect(ProjectSale.deploy(
                _times,
                _providers,
                _vestingPeriod,
                _creditReserve,
                creditToken.address,
                _usdToken,
                _projectToken,
                _projectTokenPrice,
                _projectTokenAmount,
                _totalSaleValueCapError,
                _saleClaimAddress,
                _feeClaimAddres
            )).to.be.revertedWith("ProjectSale: invalid sale value");

            projectSale = await expect(ProjectSale.deploy(
                _times,
                _providers,
                _vestingPeriod,
                _creditReserve,
                creditToken.address,
                _usdToken,
                _projectToken,
                _projectTokenPrice,
                _projectTokenAmount,
                _totalSaleValueCap,
                _saleClaimAddress,
                _feeClaimAddres
            )).to.not.be.reverted;
        });

        it("Should revert if register not started yet", async function () {
            const {
                projectSale,
                addr1,
            } = await loadFixture(deployModifyEnvironment);

            await expect(projectSale.connect(addr1).register()).to.be.revertedWith(
                "ProjectSale: registration period has not started yet"
            );
        });

        it("Should revert if register after end", async function () {
            const {
                projectSale,
                addr1,
                addr2
            } = await loadFixture(deployModifyEnvironment);

            await time.increase(2100);

            await expect(projectSale.connect(addr1).register()).to.be.revertedWith(
                "ProjectSale: registration period has ended"
            );
            await expect(projectSale.connect(addr2).register()).to.be.revertedWith(
                "ProjectSale: registration period has ended"
            );
        });

        it("Should revert on second register attempt", async function () {
            const {
                opnToken,
                busd,
                projectSale,
                addr1,
                addr2,
                addr3,
                addr4,
                addr5,
                addr6,
                addr7,
                addr8,
                addr9,
                addr10,
            } = await loadFixture(deployModifyEnvironment);

            await time.increase(1100);

            await projectSale.connect(addr1).register();
            await expect(projectSale.connect(addr1).register()).to.be.revertedWith("ProjectSale: already registered");

            await projectSale.connect(addr2).register();
            await expect(projectSale.connect(addr2).register()).to.be.revertedWith("ProjectSale: already registered");

            await projectSale.connect(addr3).register();
            await expect(projectSale.connect(addr3).register()).to.be.revertedWith("ProjectSale: already registered");

            await projectSale.connect(addr4).register();
            await expect(projectSale.connect(addr4).register()).to.be.revertedWith("ProjectSale: already registered");

            await projectSale.connect(addr5).register();
            await projectSale.connect(addr6).register();
            await projectSale.connect(addr7).register();
            await projectSale.connect(addr8).register();

            await expect(projectSale.connect(addr5).register()).to.be.revertedWith("ProjectSale: already registered");
            await expect(projectSale.connect(addr6).register()).to.be.revertedWith("ProjectSale: already registered");
            await expect(projectSale.connect(addr7).register()).to.be.revertedWith("ProjectSale: already registered");
            await expect(projectSale.connect(addr8).register()).to.be.revertedWith("ProjectSale: already registered");
        });

        it("Should only allow deposit in staking round if address is whitelisted, registered, and has enough allocation", async function () {
            const {
                projectSale,
                allocationProxy,
                busd,
                owner,
                addr1,
                addr2,
                addr10,
            } = await loadFixture(deployModifyEnvironment);

            await time.increase(1100);
            await projectSale.connect(addr1).register();
            await projectSale.connect(addr10).register();

            await time.increase(2000);

            const depositableOfAddr1 = await projectSale.depositableOf(addr1.address);
            const balanceOfAddr1 = await busd.balanceOf(addr1.address);
            const allocOfAddr1 = await allocationProxy.allocationOf(addr1.address);
            const balanceOfOwnerBefore = await busd.balanceOf(owner.address);
            await expect(balanceOfOwnerBefore).to.equal(0);

            await expect(projectSale.connect(addr10).deposit(100)).to.be.revertedWith("ProjectSale: account is not whitelisted");
            await expect(projectSale.connect(addr2).deposit(100)).to.be.revertedWith("ProjectSale: not allowed to deposit");
            await expect(projectSale.connect(addr1).deposit(depositableOfAddr1 + 100)).to.be.revertedWith("ProjectSale: amount exceeds depositable amount");

            await projectSale.connect(addr1).deposit(depositableOfAddr1);

            const balanceOfOwnerAfter = await busd.balanceOf(owner.address);
            await expect(balanceOfOwnerAfter).to.equal(depositableOfAddr1);

            const depositableOfAddr1After = await projectSale.depositableOf(addr1.address);
            expect(depositableOfAddr1After).to.equal(0);
        });

        it("Should show equal depositable, take correct fees, should not allow deposit more than cap, and should adjust amount correctly on public deposit", async function () {
            const {
                projectSale,
                feeClaimer,
                busd,
                projectToken,
                owner,
                addr1,
                addr2,
                addr3,
            } = await loadFixture(deployModifyEnvironment);

            await time.increase(1100);
            await projectSale.connect(addr1).register();
            await projectSale.connect(addr2).register();
            await projectSale.connect(addr3).register();

            await time.increase(4000);

            await projectSale.setPublicSaleCap(ethers.utils.parseUnits("10", 18));

            const depositableOfAddr1 = await projectSale.depositableOf(addr1.address);
            await expect(depositableOfAddr1).to.equal(ethers.utils.parseUnits("10", 18));
            const depositableOfAddr2 = await projectSale.depositableOf(addr2.address);
            const depositableOfAddr3 = await projectSale.depositableOf(addr3.address);
            const fee = ethers.utils.parseUnits("0.5", 18);
            console.log("fee", fee.toString());

            expect(depositableOfAddr1).to.equal(depositableOfAddr2);
            expect(depositableOfAddr2).to.equal(depositableOfAddr3);

            const balanceOfOwnerBefore = await busd.balanceOf(owner.address);
            const balanceOfFeeClaimerBefore = await busd.balanceOf(feeClaimer.address);
            await expect(balanceOfOwnerBefore).to.equal(0);
            await expect(balanceOfFeeClaimerBefore).to.equal(0);
            await projectSale.connect(addr1).deposit(depositableOfAddr1);

            const balanceOfOwnerAfter = await busd.balanceOf(owner.address);
            const balanceOfFeeClaimerAfter = await busd.balanceOf(feeClaimer.address);
            await expect(balanceOfOwnerAfter).to.equal(depositableOfAddr1);
            await expect(balanceOfFeeClaimerAfter).to.equal(fee);

            const depositableOfAddr1After = await projectSale.depositableOf(addr1.address);
            expect(depositableOfAddr1After).to.equal(0);

            await expect(projectSale.connect(addr2).deposit(BigInt(depositableOfAddr2 / 2))).to.not.be.reverted;
            await expect(projectSale.connect(addr2).deposit(depositableOfAddr2)).to.be.revertedWith("ProjectSale: amount exceeds depositable amount");

            
        });

        it("Should not allow to finalize sale twice or update times after finalization", async function () {
            const {
                projectSale,
                busd,
                projectToken,
                owner,
                addr1,
                addr2,
                addr10,
            } = await loadFixture(deployModifyEnvironment);

            await time.increase(1100);
            await projectSale.connect(addr1).register();
            await projectSale.connect(addr10).register();

            await time.increase(2000);

            const depositableOfAddr1 = await projectSale.depositableOf(addr1.address);
            const balanceOfOwnerBefore = await busd.balanceOf(owner.address);
            await expect(balanceOfOwnerBefore).to.equal(0);

            await projectSale.connect(addr1).deposit(depositableOfAddr1);

            const balanceOfOwnerAfter = await busd.balanceOf(owner.address);
            await expect(balanceOfOwnerAfter).to.equal(depositableOfAddr1);

            const depositableOfAddr1After = await projectSale.depositableOf(addr1.address);
            expect(depositableOfAddr1After).to.equal(0);

            await time.increase(5000);
            await projectToken.mint(owner.address, ethers.utils.parseUnits("10000", 18))
            await projectToken.approve(projectSale.address, ethers.utils.parseUnits("10000", 18));

            await expect(projectSale.finalizeSale()).to.not.be.reverted;

            const _newTimes = {
                registerStart: 100,
                registerEnd: 200,
                stakingRoundStart: 300,
                stakingRoundEnd: 400,
                publicRoundStart: 500,
                publicRoundEnd: 600,
                vestingStart: 700,
                vestingEnd: 800,
            };
            await expect(projectSale.updateTimes(_newTimes)).to.be.revertedWith("ProjectSale: sale is finalized");
            await expect(projectSale.finalizeSale()).to.be.revertedWith("ProjectSale: sale is finalized");
        });

        it("Should revert on invalid sale times update, pass on valid", async function () {
            const {
                projectSale
            } = await loadFixture(deployModifyEnvironment);

            const _newTimes0 = {
                registerStart: 100,
                registerEnd: 200,
                stakingRoundStart: 300,
                stakingRoundEnd: 400,
                publicRoundStart: 500,
                publicRoundEnd: 600,
                vestingStart: 700,
                vestingEnd: 800,
            };

            await expect(projectSale.updateTimes(_newTimes0)).to.not.be.reverted;

            const _newTimes1 = {
                registerStart: 100,
                registerEnd: 50,
                stakingRoundStart: 300,
                stakingRoundEnd: 400,
                publicRoundStart: 500,
                publicRoundEnd: 600,
                vestingStart: 700,
                vestingEnd: 800,
            };

            await expect(projectSale.updateTimes(_newTimes1)).to.be.revertedWith("ProjectSale: invalid time");

            const _newTimes2 = {
                registerStart: 100,
                registerEnd: 200,
                stakingRoundStart: 300,
                stakingRoundEnd: 250,
                publicRoundStart: 500,
                publicRoundEnd: 600,
                vestingStart: 700,
                vestingEnd: 800,
            };
            
            await expect(projectSale.updateTimes(_newTimes2)).to.be.revertedWith("ProjectSale: invalid time");

            const _newTimes3 = {
                registerStart: 100,
                registerEnd: 200,
                stakingRoundStart: 300,
                stakingRoundEnd: 400,
                publicRoundStart: 500,
                publicRoundEnd: 600,
                vestingStart: 300,
                vestingEnd: 400,
            };
            
            await expect(projectSale.updateTimes(_newTimes3)).to.be.revertedWith("ProjectSale: invalid time");
        });

        it("Should revert on setting invalid public sale cap, should pass on valid", async function () {
            const {
                projectSale,
            } = await loadFixture(deployModifyEnvironment);

            await expect(projectSale.setPublicSaleCap(0)).to.be.revertedWith("ProjectSale: cap cannot be zero");
            await expect(projectSale.setPublicSaleCap(100)).to.not.be.reverted;
        });
    });
});
