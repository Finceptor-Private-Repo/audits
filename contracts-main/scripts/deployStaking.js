const { ethers } = require("hardhat");
const { sleep, writeNewAddresses, readAddresses } = require("./util");

const contractName = "StakingCompound";
const contractPath = `contracts/staking/${contractName}.sol:${contractName}`;

async function main() {
    const REWARD_RATE = 1000000;
    const [STAKING_BANK] = await ethers.getSigners();
    const { utilityToken: STAKING_TOKEN } = await readAddresses("./contracts.json");
    const constructorArguments = [STAKING_TOKEN, STAKING_BANK.address, REWARD_RATE];

    const StakingCompound = await ethers.getContractFactory(contractName);
    const stakingCompound = await StakingCompound.deploy(...constructorArguments);

    console.log(`StakingCompound deployed to ${stakingCompound.address}`);
    console.log("Waiting 60 seconds for etherscan to index contract...");
    await stakingCompound.deployed();
    await sleep(60_000);

    await hre.run("verify:verify", {
        address: stakingCompound.address,
        contract: contractPath,
        constructorArguments,
    });

    console.log("Done!");
    await writeNewAddresses("./contracts.json", {
        staking: stakingCompound.address,
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
