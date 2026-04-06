const WalletFactory = artifacts.require("./WalletFactoryV4.sol");

module.exports = function (deployer) {
  deployer.deploy(WalletFactory);
};