import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const confidentialTestCoin = await deploy("ConfidentialTestCoin", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  console.log(`ConfidentialTestCoin contract deployed to: ${confidentialTestCoin.address}`);
};
export default func;
func.id = "deploy_confidential_test_coin";
func.tags = ["ConfidentialTestCoin"];