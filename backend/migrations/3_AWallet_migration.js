/**
 * @title 3_AWallet_migration.js (V3 Harness Sync)
 * @notice FactoryV3 と PolicyGuardV3 のオンチェーンデプロイ後の同期スクリプト
 */
const fs = require('fs');

module.exports = async function (deployer, network, accounts) {
  const admin = accounts[0];
  const EAS_ADDR = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia

  // 1. PolicyGuard (ExecutionContext) のデプロイ
  await deployer.deploy(PolicyGuard);
  const policyGuard = await PolicyGuard.deployed();

  // 2. AgentWalletFactoryV3 (Identity Registry) のデプロイ
  await deployer.deploy(AgentWalletFactoryV3, policyGuard.address, EAS_ADDR);
  const factory = await AgentWalletFactoryV3.deployed();

  console.log("=========================================");
  console.log("V3 HARNESS DEPLOYED:");
  console.log("AGENT_FACTORY_V3_ADDRESS:", factory.address);
  console.log("POLICY_GUARD_ADDRESS:", policyGuard.address);
  console.log("=========================================");

  // 3. Infrastructure Sync (Update Address.js and Frontend)
  const addressFile = `
module.exports = { 
  MYTOKEN_ADDRESS: "0x8dDbFD6f1832e0B1342E5871c6a8De4D8549Ca27",
  AGENT_FACTORY_V3_ADDRESS: "${factory.address}",
  POLICY_GUARD_ADDRESS: "${policyGuard.address}",
  EAS_ADDRESS: "${EAS_ADDR}"
};`;

  fs.writeFileSync('./api/contracts/Address.js', addressFile);
  console.log("[Fukasa] Infrastructure Addresses Synchronized.");
};
