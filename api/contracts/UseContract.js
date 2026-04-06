require('dotenv/config');
const { ethers } = require('ethers');
//const { KmsEthersSigner } = require('aws-kms-ethers-signer');
const log4js = require('log4js');
//const { KEY_ID, REGION_ID } = require('../utils/constants');
// log4jsの設定
log4js.configure({ appenders: { console: { type: 'console' } }, categories: { default: { appenders: ['console'], level: 'debug' } } });
const logger = log4js.getLogger("server");
const { Alchemy, Network, Wallet, Utils } = require("alchemy-sdk");

// get Mnemonic code
// const {
//     AWS_ACCESS_KEY_ID,
//     AWS_SECRET_ACCESS_KEY,
// } = process.env

const { API_KEY, PRIVATE_KEY } = process.env;

const settings = {
    apiKey: API_KEY || 'dummy',
    network: Network.MATIC_MUMBAI
};

// Graceful init: if PRIVATE_KEY is missing/invalid, use a zero key placeholder
const SAFE_KEY = (PRIVATE_KEY && /^(0x)?[0-9a-fA-F]{64}$/.test(PRIVATE_KEY))
    ? PRIVATE_KEY
    : '0x0000000000000000000000000000000000000000000000000000000000000001';

const alchemy = new Alchemy(settings);
let wallet = new Wallet(SAFE_KEY);
var provider = new ethers.providers.AlchemyProvider("maticmum", API_KEY || 'dummy');
/**
 * AWS KMS上の鍵を使ってイーサリアムクライアントインスタンスを生成するメソッド
 */
// const createKmsSigner = () => {
//     //create singer object
//     const signer = new KmsEthersSigner({
//         keyId: KEY_ID,
//         kmsClientConfig: {
//             region: REGION_ID,
//             credentials: {
//                 accessKeyId: AWS_ACCESS_KEY_ID,
//                 secretAccessKey: AWS_SECRET_ACCESS_KEY
//             }
//         },
//     });

//     return signer;
// }

/**
 * トランザクションを送信するメソッド
 * @param abi コントラクトのABI
 * @param address コントラクトのアドレス
 * @param functionName ファクション名
 * @param args ファクションの引数
 * @param rpc_url 任意のAPI RPC エンドポイント
 * @param chainId チェーンID
 * @return 送信結果
 */
const sendTx = async(abi, address, functionName, args, rpc_url, chainId) => {
    // contract interface
    var i = 0;
    if(functionName === 'mint'){
        i++
    }
    var contract = new ethers.utils.Interface(abi);
    // crate contract function data
    var func = contract.encodeFunctionData(functionName, args);
    // create wallet object
    //var wallet = createKmsSigner(); // right now using alchemy sdk to get signer
    // create provider
    var provider = new ethers.providers.AlchemyProvider("maticmum",API_KEY);
    
    // conncet provider
    wallet.connect(provider);
    const addre = await wallet.getAddress()
   
    // get nonce
    var nonce = await provider.getTransactionCount(addre, 'pending') + i;
    
    // create tx data
    var tx = {
        gasPrice: 300000000000,
        gasLimit: 2500000,
        data: func,
        to: address,
        nonce: nonce,
        chainId: 80001,
    }
    // sign tx
    var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));

    try {
        const res = await provider.sendTransaction(signedTransaction);
        
        logger.log("Tx send result:", res);
    } catch(e) {
        console.log(e)
        logger.error("Tx send error:", e);
        return false;
    }

    return true;
}

/**
 * 複数のトランザクションを一括で処理するメソッド
 * @param txs トランザクションデータの配列
 * @return 送信結果
 */
const sendBatchTx = async(txs) => {
    // get tx count
    const count = txs.length;
    // Array for signedTx
    const signedTxs = [];

    for(var i = 0; i< count; i++) {
        // contract interface
        var contract = new ethers.utils.Interface(txs[i][0]);
        // crate contract function data
        var func = contract.encodeFunctionData(txs[i][2], txs[i][3]);
        // create wallet object
        //var wallet = createKmsSigner();// using alchemy sdk
        // create provider
        var provider = new ethers.providers.JsonRpcProvider(txs[i][4]);
        // conncet provider
        wallet.connect(provider);
        // get nonce
        var nonce = await provider.getTransactionCount(await wallet.getAddress(),'pending') + i;
        // create tx data
        var tx = {
            gasPrice: 30000000000,
            gasLimit: 185000,
            data: func,
            to: txs[i][1],
            nonce: nonce,
            chainId: txs[i][5],
        }
        // sign tx
        var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));
        logger.log("signedTransaction:", signedTransaction);
        // push
        signedTxs.push(signedTransaction);
    }

    // execute
    try {
        // send tx
        var res;
        
        for(var i = 0; i< count; i++) {
            res = await provider.sendTransaction(signedTxs[i]);
            logger.log("Tx send result:", res);
        }
    } catch(e) {
        logger.error("Tx send error:", e);
        return false;
    }

    return true;
};

/**
 * 送金処理のみのトランザクションメソッド
 * @param to 送金先アドレス
 * @param value 送金額
 * @param rpc_url 任意のAPI RPC エンドポイント
 * @param chainId チェーンID
 * @return 送信結果
 */
const sendEth = async(to, value, rpc_url, chainId) => {
    // create wallet object
    //var wallet = createKmsSigner();
    // create provider
    var provider = new ethers.providers.AlchemyProvider("maticmum",API_KEY);;
    // conncet provider
    wallet.connect(provider);
    // get nonce
    var nonce = await provider.getTransactionCount(await wallet.getAddress(),'pending');

    logger.log("send ETH amount:", ethers.utils.parseEther(value.toString())._hex);
   
    // create tx data
    var tx = {
        gasPrice: 250000000000,
        gasLimit:  185000,
        to: to,
        nonce: nonce,
        chainId: 80001,
        value: ethers.utils.parseEther(value.toString())._hex
    }
    // sign tx
    var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));

    try {
        // send tx
        const res = await provider.sendTransaction(signedTransaction);
        logger.log("Tx send result:", res);
    } catch(e) {
        logger.error("Tx send error:", e);
        return false;
    }

    return true;
}


module.exports = { 
    
    sendTx,
    sendBatchTx, 
    sendEth,
    wallet,
    provider
};