/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation, and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * https://trufflesuite.com/docs/truffle/reference/configuration
 *
 * Hands-off deployment with Infura
 * --------------------------------
 *
 * Do you have a complex application that requires lots of transactions to deploy?
 * Use this approach to make deployment a breeze 🏖️:
 *
 * Infura deployment needs a wallet provider (like @truffle/hdwallet-provider)
 * to sign transactions before they're sent to a remote public node.
 * Infura accounts are available for free at 🔍: https://infura.io/register
 *
 * You'll need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. You can store your secrets 🤐 in a .env file.
 * In your project root, run `$ npm install dotenv`.
 * Create .env (which should be .gitignored) and declare your MNEMONIC
 * and Infura PROJECT_ID variables inside.
 * For example, your .env file will have the following structure:
 *
 * MNEMONIC = <Your 12 phrase mnemonic>
 * PROJECT_ID = <Your Infura project id>
 *
 * Deployment with Truffle Dashboard (Recommended for best security practice)
 * --------------------------------------------------------------------------
 *
 * Are you concerned about security and minimizing rekt status 🤔?
 * Use this method for best security:
 *
 * Truffle Dashboard lets you review transactions in detail, and leverages
 * MetaMask for signing, so there's no need to copy-paste your mnemonic.
 * More details can be found at 🔎:
 *
 * https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/
 */

require('dotenv').config();
const { MNEMONIC, PROJECT_ID } = process.env;

const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a managed Ganache instance for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache, geth, or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    // development: {
    //  host: "127.0.0.1",     // Localhost (default: none)
    //  port: 7545,            // Standard Ethereum port (default: none)
    //  network_id: "*",       // Any network (default: none)
    // },
    //
    // An additional network, but with some advanced options…
    // advanced: {
    //   port: 8777,             // Custom port
    //   network_id: 1342,       // Custom network
    //   gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
    //   gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
    //   from: <address>,        // Account to send transactions from (default: accounts[0])
    //   websocket: true         // Enable EventEmitter interface for web3 (default: false)
    // },
    //
    // Useful for deploying to a public network.
    // Note: It's important to wrap the provider as a function to ensure truffle uses a new provider every time.
    // goerli: {
    //   provider: () => new HDWalletProvider(MNEMONIC, `https://eth-goerli.g.alchemy.com/v2/${PROJECT_ID}`),
    //   network_id: 5,       // Goerli's id
    //   confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
    //   timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
    //   skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    // },
    mumbai: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://polygon-mumbai.g.alchemy.com/v2/${PROJECT_ID}`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    //
    // Useful for private networks
    // private: {
    //   provider: () => new HDWalletProvider(MNEMONIC, `https://network.io`),
    //   network_id: 2111,   // This network is yours, in the cloud.
    //   production: true    // Treats this network as if it was a public net. (default: false)
    // }
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.9",      // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  },


};

/////////////////////////////////////////////////////
//ACTUAL CONFIG

// require("dotenv").config();
// const path = require("path");
// const HDWalletProvider = require("truffle-hdwallet-provider");
// const HDWalletProvider2 = require("@truffle/hdwallet-provider");

// const {
//   HD_MNEMONIC,
//   ALCHEMY_GOERLI_API_KEY,
//   ALCHEMY_MUNBAI_APIKEY,
//   ETHERSCAN_API_KEY,
//   POLYGONSCAN_API_KEY,
//   BSCSCAN_API_KEY,
//   SNOWTRACE_API_KEY,
//   FAMTOMSCAN_API_KEY,
//   AURORASCAN_API_KEY
// } = process.env;


// module.exports = {
//   // bulid path for ABI json files
//   contracts_build_directory: path.join(__dirname, "./../frontend/src/contracts"),
//   // plugin
//   plugins: [
//     'truffle-plugin-verify'
//   ],
//   // api keys for API
//   api_keys: {
//     etherscan: ETHERSCAN_API_KEY,
//     polygonscan: POLYGONSCAN_API_KEY,
//     bscscan: BSCSCAN_API_KEY,
//     snowtrace: SNOWTRACE_API_KEY,
//     ftmscan: FAMTOMSCAN_API_KEY,
//     aurorascan: AURORASCAN_API_KEY
//   },
//   networks: {
//     goreli: {
//       provider: () => new HDWalletProvider(HD_MNEMONIC, `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_GOERLI_API_KEY}`),
//       network_id: 5,
//       gas: 5500000,
//       confirmations: 2,
//       timeoutBlocks: 200,
//       skipDryRun: true
//     },
//     mumbai: {
//       provider: () => new HDWalletProvider(HD_MNEMONIC, `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_MUNBAI_APIKEY}`),
//       network_id: 80001,
//       // gas: 500000,
//       confirmations: 2,
//       timeoutBlocks: 200,
//       skipDryRun: true
//     },
//     bsctest: {
//       provider: () => new HDWalletProvider2(HD_MNEMONIC, `https://data-seed-prebsc-1-s1.binance.org:8545`),
//       network_id: 97,
//       confirmations: 10,
//       timeoutBlocks: 200,
//       skipDryRun: true
//     },
//     fuji: {
//       provider: () => new HDWalletProvider2(HD_MNEMONIC, `https://api.avax-test.network/ext/bc/C/rpc`),
//       network_id: 43113,
//       confirmations: 10,
//       timeoutBlocks: 200,
//       skipDryRun: true
//     },
//     harmony: {
//       provider: () => new HDWalletProvider2(HD_MNEMONIC,'https://api.s0.b.hmny.io'),
//       network_id: 1666700000,
//     },
//     ftm: {
//       provider: () => new HDWalletProvider2(HD_MNEMONIC,'https://rpc.testnet.fantom.network/'),
//       network_id: 0xfa2,
//     },
//     op: {
//       provider: () => new HDWalletProvider2(HD_MNEMONIC,'https://goerli.optimism.io'),
//       network_id: 420,
//       confirmations: 10,
//       skipDryRun: true
//     },
//     arbitrum: {
//       provider: () => new HDWalletProvider2(HD_MNEMONIC,'https://goerli-rollup.arbitrum.io/rpc'),
//       network_id: 421613,
//     },
//     aurora: {
//       provider: () => new HDWalletProvider2(HD_MNEMONIC,'https://testnet.aurora.dev'),
//       network_id: 0x4e454153,
//       gas: 10000000,
//     },
//   },
//   mocha: {

//   },
//   compilers: {
//     solc: {
//       version: "0.8.0",    
//       // docker: true,        
//         settings: {          
//           optimizer: {
//             enabled: false,
//             runs: 200
//           },
//       //  evmVersion: "byzantium"
//         }
//     }
//   },
// };
