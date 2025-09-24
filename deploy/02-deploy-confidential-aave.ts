import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  const confidentialTestCoin = await get("ConfidentialTestCoin");

  const confidentialAAVE = await deploy("ConfidentialAAVE", {
    from: deployer,
    args: [confidentialTestCoin.address],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  console.log(`ConfidentialAAVE contract deployed to: ${confidentialAAVE.address}`);
  console.log(`Using ConfidentialTestCoin at: ${confidentialTestCoin.address}`);
};
export default func;
func.id = "deploy_confidential_aave";
func.tags = ["ConfidentialAAVE"];
func.dependencies = ["ConfidentialTestCoin"];