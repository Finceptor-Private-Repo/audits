const { ethers } = require("hardhat");
const { DateTime } = require("luxon");
const { sleep, readAddresses } = require("./util");

const START = 1687712400;
const ROUND_DURATION = 180;
const ROUND_DELAY = 60;

function getTimes(start, duration, delay) {
    const registerStart = DateTime.fromSeconds(start, {
        zone: "utc",
    });
    const registerEnd = registerStart.plus({ second: duration });
    const stakingRoundStart = registerEnd.plus({ second: delay });
    const stakingRoundEnd = stakingRoundStart.plus({ second: duration });
    const publicRoundStart = stakingRoundEnd.plus({ second: delay });
    const publicRoundEnd = publicRoundStart.plus({ second: duration });
    const vestingStart = publicRoundEnd.plus({ second: delay });
    const vestingEnd = vestingStart.plus({ second: duration });

    return {
        registerStart,
        registerEnd,
        stakingRoundStart,
        stakingRoundEnd,
        publicRoundStart,
        publicRoundEnd,
        vestingStart,
        vestingEnd,
    };
}

function displayProjectParams(times, sale, vesting) {
    const yamlLines = [
        "---",
        "registrationPeriod:",
        `    start: "${times.registerStart.toISO()}"`,
        `    end: "${times.registerEnd.toISO()}"`,
        "stakingRound:",
        `    start: "${times.stakingRoundStart.toISO()}"`,
        `    end: "${times.stakingRoundEnd.toISO()}"`,
        "publicRound:",
        `    start: "${times.publicRoundStart.toISO()}"`,
        `    end: "${times.publicRoundEnd.toISO()}"`,
        "vestingPeriod:",
        `    start: "${times.vestingStart.toISO()}"`,
        `    end: "${times.vestingEnd.toISO()}"`,
        "contracts:",
        `    sale: "${sale}"`,
        `    vesting: "${vesting}"`,
        "---",
    ];
    console.log(yamlLines.join("\n"));
}

function timesToUnix(times) {
    const unixTimes = {};
    for (const [key, value] of Object.entries(times)) {
        unixTimes[key] = value.toUnixInteger();
    }
    return unixTimes;
}

async function main() {
    const [DEPLOYER] = await ethers.getSigners();
    const ProjectSale = await ethers.getContractFactory("ProjectSale");
    const {
        kycProvider: KYC_PROVIDER,
        allocationProxy: ALLOCATION_PROXY,
        creditToken: CREDIT_TOKEN,
        peggedToken: PEGGED_TOKEN,
        demoToken: DEMO_TOKEN,
    } = await readAddresses("./contracts.json");
    const PROJECT_TIMES = getTimes(START, ROUND_DURATION, ROUND_DELAY);
    const TOKEN_PRICE = ethers.utils.parseEther("1");
    const TOKEN_AMOUNT = ethers.utils.parseEther("1000000");

    const _times = timesToUnix(PROJECT_TIMES);
    const _providers = {
        kycProvider: KYC_PROVIDER,
        allocationProvider: ALLOCATION_PROXY,
    };
    const _vestingPeriod = "60";
    const _creditReserve = DEPLOYER.address;
    const _creditToken = CREDIT_TOKEN;
    const _usdToken = PEGGED_TOKEN;
    const _projectToken = DEMO_TOKEN;
    const _projectTokenPrice = TOKEN_PRICE;
    const _projectTokenAmount = TOKEN_AMOUNT;
    const _totalSaleValueCap = TOKEN_AMOUNT;
    const _saleClaimAddress = DEPLOYER.address;
    const _feeClaimAddress = DEPLOYER.address;

    const constructorArguments = [
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
        _feeClaimAddress,
    ];

    const projectSale = await ProjectSale.deploy(...constructorArguments);
    await projectSale.deployed();
    const vestingAddress = await projectSale.getVestingContract();

    console.log(`ProjectSale deployed to ${projectSale.address}`);
    console.log(`Vesting deployed to ${vestingAddress}`);

    // Approve Project Sale to spend project tokens
    const DemoToken = await ethers.getContractFactory("DemoToken");
    const demoToken = DemoToken.attach(DEMO_TOKEN);
    await demoToken.mint(DEPLOYER.address, _projectTokenAmount);
    await demoToken.approve(projectSale.address, _projectTokenAmount);
    console.log(
        `DemoToken (${DEMO_TOKEN}) approved to ${
            projectSale.address
        } for ${ethers.utils.formatEther(_projectTokenAmount)} DEMO`
    );

    // Grant `ProjectSale` role to CreditToken
    const CreditToken = await ethers.getContractFactory("FinceptorCreditToken");
    const creditToken = CreditToken.attach(CREDIT_TOKEN);
    await creditToken.grantProjectSale(projectSale.address);
    console.log(`CreditToken (${CREDIT_TOKEN}) granted ProjectSale role to ${projectSale.address}`);

    console.log("Waiting 60 seconds for contract to be indexed by Etherscan...");
    await sleep(60_000);
    await hre.run("verify:verify", {
        address: projectSale.address,
        contract: "contracts/projectSale/ProjectSale.sol:ProjectSale",
        constructorArguments,
    });

    displayProjectParams(PROJECT_TIMES, projectSale.address, vestingAddress);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
