import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("confidential-aave:deposit")
  .addParam("account", "Specify which account [0, 1, 2, etc]")
  .addParam("amount", "Amount to deposit (in units)")
  .addOptionalParam("contract", "Address of the ConfidentialAAVE contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { account, amount, contract: contractAddress } = taskArguments;
    const signers = await ethers.getSigners();

    if (!contractAddress) {
      throw new Error("Please provide the contract address with --contract");
    }

    const confidentialAAVE = await ethers.getContractAt("ConfidentialAAVE", contractAddress);
    const signer = signers[account];

    console.log(`Depositing ${amount} units for account ${account} (${signer.address})`);

    const input = fhevm.createEncryptedInput(contractAddress, signer.address);
    input.add64(BigInt(amount));
    const encryptedInput = await input.encrypt();

    const transaction = await confidentialAAVE
      .connect(signer)
      .deposit(encryptedInput.handles[0], encryptedInput.inputProof);

    await transaction.wait();
    console.log(`Transaction hash: ${transaction.hash}`);
    console.log("Deposit completed successfully!");
  });

task("confidential-aave:withdraw")
  .addParam("account", "Specify which account [0, 1, 2, etc]")
  .addParam("amount", "Amount to withdraw (in units)")
  .addOptionalParam("contract", "Address of the ConfidentialAAVE contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { account, amount, contract: contractAddress } = taskArguments;
    const signers = await ethers.getSigners();

    if (!contractAddress) {
      throw new Error("Please provide the contract address with --contract");
    }

    const confidentialAAVE = await ethers.getContractAt("ConfidentialAAVE", contractAddress);
    const signer = signers[account];

    console.log(`Withdrawing ${amount} units for account ${account} (${signer.address})`);

    const input = fhevm.createEncryptedInput(contractAddress, signer.address);
    input.add64(BigInt(amount));
    const encryptedInput = await input.encrypt();

    const transaction = await confidentialAAVE
      .connect(signer)
      .withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

    await transaction.wait();
    console.log(`Transaction hash: ${transaction.hash}`);
    console.log("Withdrawal completed successfully!");
  });

task("confidential-aave:balance")
  .addParam("account", "Specify which account [0, 1, 2, etc]")
  .addOptionalParam("contract", "Address of the ConfidentialAAVE contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { account, contract: contractAddress } = taskArguments;
    const signers = await ethers.getSigners();

    if (!contractAddress) {
      throw new Error("Please provide the contract address with --contract");
    }

    const confidentialAAVE = await ethers.getContractAt("ConfidentialAAVE", contractAddress);
    const signer = signers[account];

    console.log(`Getting balance for account ${account} (${signer.address})`);

    const encryptedBalance = await confidentialAAVE.balanceOf(signer.address);
    
    try {
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedBalance,
        contractAddress,
        signer
      );
      console.log(`Balance: ${decryptedBalance} units`);
    } catch (error) {
      console.error("Failed to decrypt balance. Make sure the account has access permissions.");
      console.error("Error:", error);
    }
  });

task("confidential-aave:total-supply")
  .addOptionalParam("contract", "Address of the ConfidentialAAVE contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract: contractAddress } = taskArguments;
    const signers = await ethers.getSigners();

    if (!contractAddress) {
      throw new Error("Please provide the contract address with --contract");
    }

    const confidentialAAVE = await ethers.getContractAt("ConfidentialAAVE", contractAddress);
    const signer = signers[0]; // Use first signer

    console.log("Getting total supply...");

    const encryptedTotalSupply = await confidentialAAVE.totalSupply();
    
    try {
      const decryptedTotalSupply = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedTotalSupply,
        contractAddress,
        signer
      );
      console.log(`Total Supply: ${decryptedTotalSupply} units`);
    } catch (error) {
      console.error("Failed to decrypt total supply.");
      console.error("Error:", error);
    }
  });

task("confidential-aave:error")
  .addParam("account", "Specify which account [0, 1, 2, etc]")
  .addOptionalParam("contract", "Address of the ConfidentialAAVE contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { account, contract: contractAddress } = taskArguments;
    const signers = await ethers.getSigners();

    if (!contractAddress) {
      throw new Error("Please provide the contract address with --contract");
    }

    const confidentialAAVE = await ethers.getContractAt("ConfidentialAAVE", contractAddress);
    const signer = signers[account];

    console.log(`Getting last error for account ${account} (${signer.address})`);

    const [encryptedError, timestamp] = await confidentialAAVE.getLastError(signer.address);
    
    try {
      const decryptedError = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedError,
        contractAddress,
        signer
      );
      
      const errorMessages = {
        0: "NO_ERROR",
        1: "INSUFFICIENT_BALANCE",
        2: "INVALID_AMOUNT"
      };
      
      const errorMessage = errorMessages[Number(decryptedError)] || "UNKNOWN_ERROR";
      console.log(`Error Code: ${decryptedError} (${errorMessage})`);
      console.log(`Timestamp: ${timestamp} (${new Date(Number(timestamp) * 1000).toISOString()})`);
    } catch (error) {
      console.error("Failed to decrypt error code.");
      console.error("Error:", error);
    }
  });

task("confidential-aave:info")
  .addOptionalParam("contract", "Address of the ConfidentialAAVE contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress } = taskArguments;

    if (!contractAddress) {
      throw new Error("Please provide the contract address with --contract");
    }

    const confidentialAAVE = await ethers.getContractAt("ConfidentialAAVE", contractAddress);

    console.log("ConfidentialAAVE Contract Info:");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Token Address: ${await confidentialAAVE.token()}`);
    console.log("\nAvailable commands:");
    console.log("- hardhat confidential-aave:deposit --account 0 --amount 1000 --contract <address>");
    console.log("- hardhat confidential-aave:withdraw --account 0 --amount 500 --contract <address>");
    console.log("- hardhat confidential-aave:balance --account 0 --contract <address>");
    console.log("- hardhat confidential-aave:total-supply --contract <address>");
    console.log("- hardhat confidential-aave:error --account 0 --contract <address>");
  });