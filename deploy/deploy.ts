import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });

  console.log(`FHECounter contract: `, deployedFHECounter.address);

  // Deploy ConfidentialETH
  const deployedCETH = await deploy("ConfidentialETH", {
    from: deployer,
    log: true,
  });
  console.log(`ConfidentialETH contract: `, deployedCETH.address);

  // Deploy ConfidentialVault with cETH address
  const deployedVault = await deploy("ConfidentialVault", {
    from: deployer,
    args: [deployedCETH.address],
    log: true,
  });
  console.log(`ConfidentialVault contract: `, deployedVault.address);
};
export default func;
func.id = "deploy_all"; // id required to prevent reexecution
func.tags = ["FHECounter", "ConfidentialETH", "ConfidentialVault"];
