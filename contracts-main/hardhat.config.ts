import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import { z } from "zod";

function getConfig() {
    dotenv.config();
    const envSchema = z.object({
        BSC_SCAN_API_KEY: z.string(),
        POLYGON_SCAN_API_KEY: z.string(),
        SNOWTRACE_API_KEY: z.string(),
        GETBLOCKIO_API_KEY: z.string(),
        PRIVATE_KEY: z.string(),
    });
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("Environment variables missing check `.env.example`");
        process.exit(1);
    }
    return result.data;
}

const {
    POLYGON_SCAN_API_KEY,
    BSC_SCAN_API_KEY,
    SNOWTRACE_API_KEY,
    GETBLOCKIO_API_KEY,
    PRIVATE_KEY,
} = getConfig();

interface DeployTaskArgs {
    contract: string;
    args?: string[];
}

task("deploy", "Deploys given contract")
    .addPositionalParam("contract", "The contract to deploy")
    .addOptionalVariadicPositionalParam("args", "The arguments to pass to the constructor")
    .setAction(async ({ contract, args }: DeployTaskArgs, hre) => {
        let constructorArguments = args || [];

        await hre.run("compile");
        const { sourceName, abi } = await hre.artifacts.readArtifact(contract);

        const constructorAbi = abi.find(abi => abi.type === "constructor");
        if (constructorAbi) {
            const argSpec: string[] = constructorAbi.inputs.map((input: { name: string }) =>
                input.name
                    .substring(1)
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, str => str.toUpperCase())
            );
            if (constructorArguments.length !== argSpec.length) {
                throw new Error(
                    `Expected ${argSpec.length} arguments, got ${constructorArguments.length}`
                );
            }
            if (argSpec.length) {
                console.log(`Deploying ${contract} from ${sourceName} with arguments:`);
                argSpec.forEach((arg, i) => {
                    console.log(`- ${arg}\t${constructorArguments[i]}`);
                });
            }
        }

        const [deployer] = await hre.ethers.getSigners();
        console.log(`Deployer address: ${deployer.address}`);

        const ContractFactory = await hre.ethers.getContractFactory(contract);
        const Contract = await ContractFactory.deploy(...constructorArguments);
        await Contract.deployed();
        await Contract.deployed();
        await Contract.deployed();
        await new Promise(f => setTimeout(f, 30000));
        await Contract.deployed();
        await Contract.deployed();

        console.log(`Deployed ${contract} at ${Contract.address}`);

        await hre.run("verify:verify", {
            address: Contract.address,
            contract: `${sourceName}:${contract}`,
            constructorArguments,
        });
    });

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.16",
        settings: {
            //viaIR: true,
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    gasReporter: {
        enabled: true,
    },
    networks: {
        bsc: {
            url: "https://bsc.getblock.io/mainnet/",
            chainId: 56,
            accounts: [PRIVATE_KEY],
            httpHeaders: {
                "x-api-key": GETBLOCKIO_API_KEY,
            },
        },
        bscTestnet: {
            url: "https://bsc.getblock.io/testnet/",
            chainId: 97,
            accounts: [PRIVATE_KEY],
            httpHeaders: {
                "x-api-key": GETBLOCKIO_API_KEY,
            },
        },
        avalanche: {
            url: "https://avax.getblock.io/mainnet/ext/bc/C/rpc",
            chainId: 43114,
            accounts: [PRIVATE_KEY],
            httpHeaders: {
                "x-api-key": GETBLOCKIO_API_KEY,
            },
        },
        avalancheFujiTestnet: {
            url: "https://avax.getblock.io/testnet/ext/bc/C/rpc",
            chainId: 43113,
            accounts: [PRIVATE_KEY],
            httpHeaders: {
                "x-api-key": GETBLOCKIO_API_KEY,
            },
        },
        polygon: {
            url: "https://matic.getblock.io/mainnet/",
            chainId: 137,
            accounts: [PRIVATE_KEY],
            httpHeaders: {
                "x-api-key": GETBLOCKIO_API_KEY,
            },
        },
        polygonMumbai: {
            url: "https://matic.getblock.io/testnet/",
            chainId: 80001,
            accounts: [PRIVATE_KEY],
            httpHeaders: {
                "x-api-key": GETBLOCKIO_API_KEY,
            },
        },
    },
    etherscan: {
        apiKey: {
            bsc: BSC_SCAN_API_KEY,
            bscTestnet: BSC_SCAN_API_KEY,
            avalanche: SNOWTRACE_API_KEY,
            avalancheFujiTestnet: SNOWTRACE_API_KEY,
            polygon: POLYGON_SCAN_API_KEY,
            polygonMumbai: POLYGON_SCAN_API_KEY,
        },
    },
};

export default config;
