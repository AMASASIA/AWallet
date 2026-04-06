/**
 * IPFS関連のメソッドを実装したモジュールファイル
 */

const {
      PINATA_API_KEY,
      PINATA_API_SECRET
} = process.env;

// get contants 
const {
      FOLDER_PATH
} = require('./../../utils/constants');

const log4js = require('log4js');
// log4jsの設定 (Cloud Run: console output)
log4js.configure({ appenders: { console: { type: 'console' } }, categories: { default: { appenders: ['console'], level: 'debug' } } });
const logger = log4js.getLogger("server");
const fs = require('fs');
const pinataSDK = require('@pinata/sdk');

// create PinataSDK object
const pinata = new pinataSDK({ 
      pinataApiKey:  PINATA_API_KEY, 
      pinataSecretApiKey: PINATA_API_SECRET
});

// option
const options = {
      pinataMetadata: {
          name: 'Wallet',
          keyvalues: {
              productName: 'Wallet',
          }
      },
      pinataOptions: {
          cidVersion: 0
      }
};

/**
 * jsonオブジェクトをIPFSにアップロードするメソッド
 */
const uploadJsonToIpfs = async(data) => {
      try {
            const result = await pinata.pinJSONToIPFS(data, options);
            logger.debug("pinJSONToIPFS result:", result);
            return result;
      } catch (err) {
            logger.error("pinJSONToIPFS error:", err);
            return null;
      }
};

/**
 * ファイルをIPFSにアップロードするメソッド
 */
const uploadFileToIpfs = async(data, addr) => {
      try {
            const filePath = `${FOLDER_PATH}/${addr}.json`;
            if (!fs.existsSync(FOLDER_PATH)) {
                  fs.mkdirSync(FOLDER_PATH, { recursive: true });
            }
            fs.writeFileSync(filePath, data, 'utf-8');
            const readableStreamForFile = fs.createReadStream(filePath);
            const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
            logger.debug("uploadFileToIpfs result:", result);
            return result;
      } catch (err) {
            logger.error("uploadFileToIpfs error:", err);
            return null;
      }
};

module.exports = {
      uploadJsonToIpfs,
      uploadFileToIpfs
};
