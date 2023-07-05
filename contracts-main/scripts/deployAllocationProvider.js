const { ethers } = require("hardhat");
const { sleep, writeNewAddresses, readAddresses } = require("./util");

async function main() {
    const { creditToken: CREDIT_TOKEN, staking: STAKING } = await readAddresses("./contracts.json");
    const ALPHA = ethers.utils.parseEther("0.8");
    const BETA = ethers.utils.parseEther("0.2");
    const TETHA = ethers.utils.parseEther("0");
    const TOTAL_ALLOCATION = ethers.utils.parseEther("1000000");

    const [
        CreditAllocationProvider,
        DirectAllocationProvider,
        StakingAllocationProvider,
        AllocationProxy,
    ] = await Promise.all([
        ethers.getContractFactory("CreditAllocationProvider"),
        ethers.getContractFactory("DirectAllocationProvider"),
        ethers.getContractFactory("StakingAllocationProvider"),
        ethers.getContractFactory("AllocationProxy"),
    ]);

    const creditAllocationProvider = await CreditAllocationProvider.deploy(CREDIT_TOKEN);
    await creditAllocationProvider.deployed();
    console.log(`CreditAllocationProvider deployed to: ${creditAllocationProvider.address}`);

    const directAllocationProvider = await DirectAllocationProvider.deploy();
    await directAllocationProvider.deployed();
    console.log(`DirectAllocationProvider deployed to: ${directAllocationProvider.address}`);

    const stakingArguments = [STAKING, ALPHA, BETA, TETHA];
    const stakingAllocationProvider = await StakingAllocationProvider.deploy(...stakingArguments);
    await stakingAllocationProvider.deployed();
    console.log(`StakingAllocationProvider deployed to: ${stakingAllocationProvider.address}`);

    const proxyArguments = [
        creditAllocationProvider.address,
        directAllocationProvider.address,
        stakingAllocationProvider.address,
        TOTAL_ALLOCATION,
    ];
    const allocationProxy = await AllocationProxy.deploy(...proxyArguments);
    await allocationProxy.deployed();
    console.log(`AllocationProxy deployed to: ${allocationProxy.address}`);

    console.log("Waiting 60 seconds for etherscan to index contract...");
    await sleep(60_000);

    await hre.run("verify:verify", {
        address: creditAllocationProvider.address,
        contract: "contracts/allocation/CreditAllocationProvider.sol:CreditAllocationProvider",
        constructorArguments: [CREDIT_TOKEN],
    });

    await hre.run("verify:verify", {
        address: directAllocationProvider.address,
        contract: "contracts/allocation/DirectAllocationProvider.sol:DirectAllocationProvider",
    });

    await hre.run("verify:verify", {
        address: stakingAllocationProvider.address,
        contract: "contracts/allocation/StakingAllocationProvider.sol:StakingAllocationProvider",
        constructorArguments: stakingArguments,
    });

    await hre.run("verify:verify", {
        address: allocationProxy.address,
        contract: "contracts/allocation/AllocationProxy.sol:AllocationProxy",
        constructorArguments: proxyArguments,
    });

    console.log("Done!");
    await writeNewAddresses("./contracts.json", {
        creditAllocationProvider: creditAllocationProvider.address,
        directAllocationProvider: directAllocationProvider.address,
        stakingAllocationProvider: stakingAllocationProvider.address,
        allocationProxy: allocationProxy.address,
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
