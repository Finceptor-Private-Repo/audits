const { ethers } = require("hardhat");
const { sleep, writeNewAddresses } = require("./util");

async function main() {
    console.log("Deploying tokens...");
    const [Finceptor, FinceptorCreditToken, DemoToken, TetherUS] = await Promise.all([
        ethers.getContractFactory("Finceptor"),
        ethers.getContractFactory("FinceptorCreditToken"),
        ethers.getContractFactory("DemoToken"),
        ethers.getContractFactory("TetherUS"),
    ]);

    const utilityToken = await Finceptor.deploy();
    console.log(`Finceptor deployed to ${utilityToken.address}`);

    const creditToken = await FinceptorCreditToken.deploy();
    console.log(`FinceptorCreditToken deployed to ${creditToken.address}`);

    const demoToken = await DemoToken.deploy();
    console.log(`DemoToken deployed to ${demoToken.address}`);

    const peggedToken = await TetherUS.deploy();
    console.log(`TetherUS deployed to ${peggedToken.address}`);

    console.log("Waiting 60 seconds for etherscan to index contract...");
    await Promise.all([
        utilityToken.deployed(),
        creditToken.deployed(),
        demoToken.deployed(),
        peggedToken.deployed(),
    ]);
    await sleep(60_000);

    await hre.run("verify:verify", {
        address: utilityToken.address,
        contract: "contracts/token/Finceptor.sol:Finceptor",
    });
    await hre.run("verify:verify", {
        address: creditToken.address,
        contract: "contracts/token/FinceptorCreditToken.sol:FinceptorCreditToken",
    });
    await hre.run("verify:verify", {
        address: demoToken.address,
        contract: "contracts/token/DemoToken.sol:DemoToken",
    });
    await hre.run("verify:verify", {
        address: peggedToken.address,
        contract: "contracts/token/TetherUS.sol:TetherUS",
    });

    console.log("Done!");
    await writeNewAddresses("./contracts.json", {
        utilityToken: utilityToken.address,
        creditToken: creditToken.address,
        demoToken: demoToken.address,
        peggedToken: peggedToken.address,
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
