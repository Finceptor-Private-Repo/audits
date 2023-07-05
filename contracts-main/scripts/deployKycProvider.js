const { ethers } = require("hardhat");
const { sleep, writeNewAddresses, readAddresses } = require("./util");

const contractName = "BasicKYCProvider";
const contractPath = `contracts/kyc/${contractName}.sol:${contractName}`;

async function main() {
    const BasicKycProvider = await ethers.getContractFactory(contractName);
    const basicKycProvider = await BasicKycProvider.deploy();

    console.log(`${contractName} deployed to ${basicKycProvider.address}`);
    console.log("Waiting 60 seconds for etherscan to index contract...");
    await basicKycProvider.deployed();
    await sleep(60_000);

    await hre.run("verify:verify", {
        address: basicKycProvider.address,
        contract: contractPath,
    });

    console.log("Done!");
    await writeNewAddresses("./contracts.json", {
        kycProvider: basicKycProvider.address,
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
