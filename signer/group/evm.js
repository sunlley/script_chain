const Core = require('./core');
const Ethers = require('ethers');
const Web3Utils = require("web3-utils");
const Decimal = require("decimal.js");

const Log=function(){
    console.log(...arguments);
}

class EVM extends Core{
    constructor(name,chainId,rpc) {
        super(name);
        this.chainId = chainId;
        this.rpc=rpc;
        // this.web3 = new Web3();
    }

    async generateAccount(key) {
        let wallet ;
        if (key){
            const isMnemonic = this.validateMnemonic(key);
            if (isMnemonic){
                key = this.getPrivateKey(key);
            }
            wallet = new Ethers.Wallet(key);
        }else{
            wallet = Ethers.Wallet.createRandom();
        }
        return {
            address:wallet.address,
            privateKey:wallet.privateKey,
            publicKey:wallet.publicKey,
            mnemonic:wallet.mnemonic
        };
    }

    async getKeystore(key,password){
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic){
            key = this.getPrivateKey(key);
        }
        const wallet = new Ethers.Wallet(key)
        const result = await wallet.encrypt(password);
        return result+"";
    }

    getPrivateKeyFromAny(key, other) {
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic){
            return  this.getPrivateKey(key);
        }
        if (other){
            let result = this.getPrivateKeyFromKeystore(key,other);
            if (result){
                return result;
            }
        }
        return  key;
    }

    getPrivateKeyFromKeystore(json, password) {
        // var result='';
        // try {
        //     result = this.web3.eth.accounts.decrypt(json, password);
        //     result=result.privateKey;
        // } catch (e) {
        //     console.log("getPrivateKeyFromKeystore 获取失败",json,password,e)
        // }
        // return result;

        const wallet = Ethers.Wallet.fromEncryptedJsonSync(json,password)
        return wallet.privateKey.toString();
    }

    async getPrivateKey(mnemonic) {
        return new Promise(resolve => {
            console.log(`===> getPrivateKey 01 | ${mnemonic}`)
            const wallet = Ethers.Wallet.fromMnemonic(mnemonic);
            Ethers.constants.MaxUint256
            const pk = wallet.privateKey.toString();
            console.log(`===> getPrivateKey 02 | ${pk}`)
            resolve(pk)
        })
    }

    getPublicKey(key) {
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic){
            key = this.getPrivateKey(key);
        }
        const wallet = new Ethers.Wallet(key);
        return wallet.publicKey.toString();
    }

    getAddress(key) {
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic){
            key = this.getPrivateKey(key);
        }
        const wallet = new Ethers.Wallet(key);
        return wallet.address;
    }

    validatePrivateKey(privateKey){
        try {
            new Ethers.Wallet(privateKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    validateAddress(address) {
        try {
            Ethers.utils.getAddress(address);
            return true;
        } catch (e) {
            return false;
        }
    }

    async signMessage(key, message) {
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic){
            key = this.getPrivateKey(key);
        }
        // Log('Sign Message ===>> ',typeof message,JSON.stringify(message));
        const wallet = new Ethers.Wallet(key);
        if(typeof message == 'string' && message.startsWith('{')) {
            message = JSON.parse(message);
        }
        // if (typeof message == 'object' && message.data){
        //     message = message.data;
        // }
        let dataPre = message.data;
        delete message['privateKey']
        // console.log("Sign Message 01 ==> ",JSON.stringify(message));
        // return await wallet.signMessage(message);
        // let result = await wallet.signMessage(message.data);
        // Log(result)
        if (message.__type === 'personal'){
            dataPre = Ethers.utils.arrayify(dataPre)
        }

        try {
            let result = await wallet.signMessage(dataPre);
            // console.log("Sign Message 02 ==> ", result);
            return result;
        } catch (e) {
            // console.log("Sign Message 03 ==> ", e,toString());
            return '';
        }
    }

    /**
     *
     * to        ['tokenAddress','toAddress','to']
     * amount    ['amount','value']
     * nonce     ['nonce']
     * inputData ['data']
     * gasLimit  ['gasLimit']
     * gasPrice  ['gasPrice']
     * chainId   ['chainId']
     * decimal   ['decimal','decimals']
     *
     * @param key
     * @param data
     * @returns {Promise<unknown>}
     */
    async signTransaction(key,data){
        if(typeof data == 'string') data = JSON.parse(data);
        Log('signTransaction ==>> 01',JSON.stringify(data));
        console.log('-')
        key = this.getPrivateKeyFromAny(key);
        Log('signTransaction ==>> 02')
        console.log('-')
        const wallet = new Ethers.Wallet(key);
        Log('signTransaction ==>> 03')
        console.log('-')
        let decimal = this.getInteger(data,['decimal','decimals'],18);
        Log('signTransaction ==>> 04')
        console.log('-')
        let from = wallet.address.toString();
        Log('signTransaction ==>> 05')
        console.log('-')
        let to = this.getString(data,['tokenAddress','toAddress','to'])
        Log('signTransaction ==>> 06')
        console.log('-')
        let amount = this.getString(data,['amount','value'],'0')
        Log('signTransaction ==>> 07',amount,decimal)
        console.log('-')
        if (!this.strIsHex(amount)){
            amount =new Decimal(amount).mul(Math.pow(10, decimal)).toHex();
        }
        // if (!isNaN(amount)){}
        Log('signTransaction ==>> 08',amount,decimal)
        console.log('-')
        let nonce = new Decimal(this.getString(data,['nonce'],'0')).toHex();
        Log('signTransaction ==>> 09')
        console.log('-')
        let inputData = this.getString(data,['data'],'0x');
        Log('signTransaction ==>> 010')
        console.log('-')
        let gasLimit = this.getInteger(data,['gasLimit'],21000);
        Log('signTransaction ==>> 011')
        console.log('-')
        let gasPrice = this.getString(data,['gasPrice'],'0');
        Log('signTransaction ==>> 012')
        console.log('-')
        if (!this.strIsHex(gasPrice)){
            gasPrice = new Decimal(gasPrice).mul(Math.pow(10, decimal)).toHex();
        }
        Log('signTransaction ==>> 013')
        console.log('-')
        // gasPrice = Web3Utils.toHex(gasPrice);
        Log('signTransaction ==>> 014')
        console.log('-')
        let chainId=this.getString(data,['chainId'],`${this.chainId}`);
        Log('signTransaction ==>> 015')
        console.log('-')
        chainId = this.hextonumberstring(chainId,'1');
        Log('signTransaction ==>> 016')
        console.log('-')
        chainId = parseInt(chainId);
        Log('signTransaction ==>> 017')
        console.log('-')
        // chainId = Web3Utils.toHex(chainId);
        const transaction = {
            nonce: nonce,
            from: from,
            to: to,
            value: amount,
            data: inputData,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            chainId: chainId
        };
        Log('Transaction 02',JSON.stringify(transaction));
        return new Promise((resolve,reject)=>{
            wallet.signTransaction(transaction).then(result=>{
                resolve(result);
            }).catch(err=>{
                console.log("createTransaction sign error",err.toString())
                reject(err);
            })
        });
    }
}

module.exports = EVM;
