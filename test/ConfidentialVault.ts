import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { ConfidentialETH__factory, ConfidentialVault__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

describe("ConfidentialVault", function () {
  let signers: Signers;
  let ceth: Awaited<ReturnType<ConfidentialETH__factory["deploy"]>>;
  let vault: Awaited<ReturnType<ConfidentialVault__factory["deploy"]>>;
  let vaultAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    // Deploy cETH
    const cethFactory = (await ethers.getContractFactory("ConfidentialETH")) as ConfidentialETH__factory;
    ceth = await cethFactory.deploy();

    // Deploy Vault
    const vaultFactory = (await ethers.getContractFactory("ConfidentialVault")) as ConfidentialVault__factory;
    vault = await vaultFactory.deploy(await ceth.getAddress());
    vaultAddress = await vault.getAddress();

    // Give Alice some cETH via faucet
    await (await ceth.connect(signers.alice).faucet()).wait();

    // Authorize vault as operator for Alice
    const until = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    await (await ceth.connect(signers.alice).setOperator(vaultAddress, until)).wait();
  });

  it("deposit increases encrypted vault balance", async function () {
    // Encrypt 1_000_000 (1.0 with 6 decimals) for deposit
    const encrypted = await fhevm
      // deposit validates input in the Vault
      .createEncryptedInput(vaultAddress, signers.alice.address)
      .add64(1_000_000)
      .encrypt();

    await (
      await vault.connect(signers.alice).deposit(encrypted.handles[0], encrypted.inputProof)
    ).wait();

    const encBal = await vault.balanceOf(signers.alice.address);
    expect(encBal).to.not.eq(ethers.ZeroHash);

    const clearBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encBal,
      vaultAddress,
      signers.alice,
    );
    expect(clearBal).to.eq(1_000_000);
  });

  it("withdraw decreases encrypted vault balance", async function () {
    // First deposit 1_000_000
    const dep = await fhevm
      .createEncryptedInput(vaultAddress, signers.alice.address)
      .add64(1_000_000)
      .encrypt();
    await (await vault.connect(signers.alice).deposit(dep.handles[0], dep.inputProof)).wait();

    // Then withdraw 400_000
    const wd = await fhevm
      // withdraw validates input in the Vault itself
      .createEncryptedInput(vaultAddress, signers.alice.address)
      .add64(400_000)
      .encrypt();
    await (await vault.connect(signers.alice).withdraw(wd.handles[0], wd.inputProof)).wait();

    const encBal = await vault.balanceOf(signers.alice.address);
    const clearBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encBal,
      vaultAddress,
      signers.alice,
    );
    expect(clearBal).to.eq(600_000);
  });
});
