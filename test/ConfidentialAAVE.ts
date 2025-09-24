import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { ConfidentialAAVE, ConfidentialTestCoin } from "../types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialAAVE", function () {
  let confidentialAAVE: ConfidentialAAVE;
  let confidentialTestCoin: ConfidentialTestCoin;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    alice = signers[1];
    bob = signers[2];

    // Deploy ConfidentialTestCoin
    const ConfidentialTestCoinFactory = await ethers.getContractFactory("ConfidentialTestCoin");
    confidentialTestCoin = await ConfidentialTestCoinFactory.deploy();
    await confidentialTestCoin.waitForDeployment();

    // Deploy ConfidentialAAVE
    const ConfidentialAAVEFactory = await ethers.getContractFactory("ConfidentialAAVE");
    confidentialAAVE = await ConfidentialAAVEFactory.deploy(await confidentialTestCoin.getAddress());
    await confidentialAAVE.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await confidentialAAVE.token()).to.equal(await confidentialTestCoin.getAddress());
    });

    it("Should initialize total supply to zero", async function () {
      const totalSupply = await confidentialAAVE.totalSupply();
      const decryptedTotalSupply = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        totalSupply,
        await confidentialAAVE.getAddress(),
        owner
      );
      expect(decryptedTotalSupply).to.equal(0n);
    });
  });

  describe("Deposit", function () {
    it("Should successfully deposit tokens", async function () {
      const depositAmount = 1000n;

      // Create encrypted input
      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(depositAmount);
      const encryptedInput = await input.encrypt();

      // Perform deposit
      await confidentialAAVE
        .connect(alice)
        .deposit(encryptedInput.handles[0], encryptedInput.inputProof);

      // Check balance
      const balance = await confidentialAAVE.balanceOf(alice.address);
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balance,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedBalance).to.equal(depositAmount);

      // Check total supply
      const totalSupply = await confidentialAAVE.totalSupply();
      const decryptedTotalSupply = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        totalSupply,
        await confidentialAAVE.getAddress(),
        owner
      );
      expect(decryptedTotalSupply).to.equal(depositAmount);
    });

    it("Should handle multiple deposits from the same user", async function () {
      const firstDeposit = 500n;
      const secondDeposit = 300n;

      // First deposit
      const input1 = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input1.add64(firstDeposit);
      const encryptedInput1 = await input1.encrypt();

      await confidentialAAVE
        .connect(alice)
        .deposit(encryptedInput1.handles[0], encryptedInput1.inputProof);

      // Second deposit
      const input2 = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input2.add64(secondDeposit);
      const encryptedInput2 = await input2.encrypt();

      await confidentialAAVE
        .connect(alice)
        .deposit(encryptedInput2.handles[0], encryptedInput2.inputProof);

      // Check final balance
      const balance = await confidentialAAVE.balanceOf(alice.address);
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balance,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedBalance).to.equal(firstDeposit + secondDeposit);
    });

    it("Should set error when depositing zero amount", async function () {
      const depositAmount = 0n;

      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(depositAmount);
      const encryptedInput = await input.encrypt();

      await confidentialAAVE
        .connect(alice)
        .deposit(encryptedInput.handles[0], encryptedInput.inputProof);

      // Check error code
      const [errorCode] = await confidentialAAVE.getLastError(alice.address);
      const decryptedError = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        errorCode,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedError).to.equal(2n); // INVALID_AMOUNT
    });

    it("Should handle deposits from multiple users", async function () {
      const aliceDeposit = 1000n;
      const bobDeposit = 2000n;

      // Alice deposit
      const aliceInput = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      aliceInput.add64(aliceDeposit);
      const aliceEncryptedInput = await aliceInput.encrypt();

      await confidentialAAVE
        .connect(alice)
        .deposit(aliceEncryptedInput.handles[0], aliceEncryptedInput.inputProof);

      // Bob deposit
      const bobInput = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        bob.address
      );
      bobInput.add64(bobDeposit);
      const bobEncryptedInput = await bobInput.encrypt();

      await confidentialAAVE
        .connect(bob)
        .deposit(bobEncryptedInput.handles[0], bobEncryptedInput.inputProof);

      // Check balances
      const aliceBalance = await confidentialAAVE.balanceOf(alice.address);
      const decryptedAliceBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceBalance,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedAliceBalance).to.equal(aliceDeposit);

      const bobBalance = await confidentialAAVE.balanceOf(bob.address);
      const decryptedBobBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobBalance,
        await confidentialAAVE.getAddress(),
        bob
      );
      expect(decryptedBobBalance).to.equal(bobDeposit);

      // Check total supply
      const totalSupply = await confidentialAAVE.totalSupply();
      const decryptedTotalSupply = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        totalSupply,
        await confidentialAAVE.getAddress(),
        owner
      );
      expect(decryptedTotalSupply).to.equal(aliceDeposit + bobDeposit);
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      // Deposit some tokens for Alice first
      const depositAmount = 1000n;
      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(depositAmount);
      const encryptedInput = await input.encrypt();

      await confidentialAAVE
        .connect(alice)
        .deposit(encryptedInput.handles[0], encryptedInput.inputProof);
    });

    it("Should successfully withdraw tokens", async function () {
      const withdrawAmount = 500n;

      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await confidentialAAVE
        .connect(alice)
        .withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

      // Check remaining balance
      const balance = await confidentialAAVE.balanceOf(alice.address);
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balance,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedBalance).to.equal(1000n - withdrawAmount);

      // Check total supply decreased
      const totalSupply = await confidentialAAVE.totalSupply();
      const decryptedTotalSupply = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        totalSupply,
        await confidentialAAVE.getAddress(),
        owner
      );
      expect(decryptedTotalSupply).to.equal(1000n - withdrawAmount);
    });

    it("Should withdraw full balance", async function () {
      const withdrawAmount = 1000n; // Full balance

      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await confidentialAAVE
        .connect(alice)
        .withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

      // Check balance is zero
      const balance = await confidentialAAVE.balanceOf(alice.address);
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balance,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedBalance).to.equal(0n);
    });

    it("Should set error when withdrawing more than balance", async function () {
      const withdrawAmount = 1500n; // More than deposited

      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await confidentialAAVE
        .connect(alice)
        .withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

      // Check error code
      const [errorCode] = await confidentialAAVE.getLastError(alice.address);
      const decryptedError = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        errorCode,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedError).to.equal(1n); // INSUFFICIENT_BALANCE

      // Balance should remain unchanged
      const balance = await confidentialAAVE.balanceOf(alice.address);
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balance,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedBalance).to.equal(1000n);
    });

    it("Should set error when withdrawing zero amount", async function () {
      const withdrawAmount = 0n;

      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await confidentialAAVE
        .connect(alice)
        .withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

      // Check error code
      const [errorCode] = await confidentialAAVE.getLastError(alice.address);
      const decryptedError = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        errorCode,
        await confidentialAAVE.getAddress(),
        alice
      );
      expect(decryptedError).to.equal(2n); // INVALID_AMOUNT
    });

    it("Should not allow withdrawal from empty balance", async function () {
      const withdrawAmount = 100n;

      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        bob.address // Bob has no balance
      );
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await confidentialAAVE
        .connect(bob)
        .withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

      // Check error code
      const [errorCode] = await confidentialAAVE.getLastError(bob.address);
      const decryptedError = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        errorCode,
        await confidentialAAVE.getAddress(),
        bob
      );
      expect(decryptedError).to.equal(1n); // INSUFFICIENT_BALANCE
    });
  });

  describe("Events", function () {
    it("Should emit Deposited event", async function () {
      const depositAmount = 1000n;

      const input = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      input.add64(depositAmount);
      const encryptedInput = await input.encrypt();

      await expect(
        confidentialAAVE
          .connect(alice)
          .deposit(encryptedInput.handles[0], encryptedInput.inputProof)
      )
        .to.emit(confidentialAAVE, "Deposited")
        .withArgs(alice.address, await ethers.provider.getBlockNumber() + 1);
    });

    it("Should emit Withdrawn event", async function () {
      // First deposit
      const depositAmount = 1000n;
      const depositInput = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      depositInput.add64(depositAmount);
      const depositEncryptedInput = await depositInput.encrypt();

      await confidentialAAVE
        .connect(alice)
        .deposit(depositEncryptedInput.handles[0], depositEncryptedInput.inputProof);

      // Then withdraw
      const withdrawAmount = 500n;
      const withdrawInput = fhevm.createEncryptedInput(
        await confidentialAAVE.getAddress(),
        alice.address
      );
      withdrawInput.add64(withdrawAmount);
      const withdrawEncryptedInput = await withdrawInput.encrypt();

      await expect(
        confidentialAAVE
          .connect(alice)
          .withdraw(withdrawEncryptedInput.handles[0], withdrawEncryptedInput.inputProof)
      )
        .to.emit(confidentialAAVE, "Withdrawn")
        .withArgs(alice.address, await ethers.provider.getBlockNumber() + 1);
    });
  });
});