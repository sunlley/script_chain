const Core = require('./core');
const Ethers = require('ethers');
const mtoken = require('./mtoken.json');
const Web3Utils = require("web3-utils");
const Web3EthContract = require('web3-eth-contract');
const Web3Eth = require('web3-eth');
const Decimal = require("decimal.js");
const {netSign} = require("../util/utils");

const Log = function () {
    console.log(...arguments);
}

class EVM extends Core {

    constructor(name, server, chainId, rpc, decimals, config) {
        super(name, server, config);
        this.chainId = chainId;
        this.rpc = rpc;
        this.decimals = decimals ? decimals : 18;
    }

    log() {
        if (this.debug) {
            console.log(`[${this.name}] `, ...arguments);
        }
    }

    generateMnemonic() {
        this.log('generateMnemonic', '1/2');
        let wallet = Ethers.Wallet.createRandom();
        this.log('generateMnemonic', '2/2');
        return wallet.mnemonic;
    }

    async generateAccount(key) {
        this.log('generateAccount', '1/2', key);
        let wallet;
        if (key) {
            this.log('generateAccount', '2-1/2', key);
            const isMnemonic = this.validateMnemonic(key);
            if (isMnemonic) {
                key = this.getPrivateKey(key);
            }
            wallet = new Ethers.Wallet(key);
        } else {
            this.log('generateAccount', '2-2/2', key);
            wallet = Ethers.Wallet.createRandom();
        }
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            mnemonic: wallet.mnemonic
        };
    }

    async getKeystore(key, password) {
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic) {
            key = this.getPrivateKey(key);
        }
        const wallet = new Ethers.Wallet(key)
        const result = await wallet.encrypt(password);
        return result + "";
    }

    async getPrivateKey(mnemonic) {
        return new Promise(resolve => {
            this.log('getPrivateKey', '1/2', mnemonic);
            const wallet = Ethers.Wallet.fromMnemonic(mnemonic);
            const pk = wallet.privateKey.toString();
            this.log('getPrivateKey', '2/2', pk);
            resolve(pk)
        })
    }

    getPrivateKeyFromAny(key, other) {
        this.log('getPrivateKeyFromAny', '1/2', key);
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic) {
            return this.getPrivateKey(key);
        }
        if (other) {
            let result = this.getPrivateKeyFromKeystore(key, other);
            if (result) {
                return result;
            }
        }
        return key;
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

        const wallet = Ethers.Wallet.fromEncryptedJsonSync(json, password)
        return wallet.privateKey.toString();
    }

    getPublicKey(key) {
        this.log('getPublicKey', '1/2', key);
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic) {
            key = this.getPrivateKey(key);
        }
        const wallet = new Ethers.Wallet(key);
        let pb = wallet.publicKey.toString();
        this.log('getPublicKey', '2/2', pb);
        return pb;
    }

    getAddress(key) {
        this.log('getAddress', '1/2', key);
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic) {
            key = this.getPrivateKey(key);
        }
        const wallet = new Ethers.Wallet(key);
        this.log('getAddress', '2/2', wallet.address);
        return wallet.address;
    }

    validatePrivateKey(privateKey) {
        this.log('validatePrivateKey', '1/2', privateKey);
        try {
            new Ethers.Wallet(privateKey);
            this.log('validatePrivateKey', '2/2', true);
            return true;
        } catch (e) {
            this.log('validatePrivateKey', '2/2', false, e);
            return false;
        }
    }

    validateAddress(address) {
        this.log('validateAddress', '1/2', address);
        try {
            Ethers.utils.getAddress(address);
            this.log('validateAddress', '2/2', true);
            return true;
        } catch (e) {
            this.log('validateAddress', '2/2', false, e);
            return false;
        }
    }

    encodeERC20ABI(payload) {
        this.log('encodeERC20ABI', '1/3', JSON.stringify(payload));
        let {contractAddress, contractMethod, params, abi} = payload;
        if (!abi || abi.length <= 0) {
            abi = mtoken;
        }
        const contract = new Web3EthContract(abi, contractAddress);
        this.log('encodeERC20ABI', '2/3');
        let data = contract.methods[contractMethod](...params).encodeABI();
        this.log('encodeERC20ABI', '3/3', data);
        return data;
    }

    async signMessage(key, message) {
        this.log('signMessage', '1/5', key, message);
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic) {
            key = this.getPrivateKey(key);
        }
        const wallet = new Ethers.Wallet(key);
        if (typeof message == 'string' && message.startsWith('{')) {
            message = JSON.parse(message);
        }
        this.log('signMessage', '2/5', message);
        let dataPre = message.data;
        delete message['privateKey']
        this.log('signMessage', '3/5', JSON.stringify(message));
        if (message.__type === 'personal') {
            dataPre = Ethers.utils.arrayify(dataPre)
        }
        this.log('signMessage', '4/5', dataPre.toString());
        try {
            let result = await wallet.signMessage(dataPre);
            this.log('signMessage', '5/5', result);
            return result;
        } catch (e) {
            this.log('signMessage', '5/5', e);
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
    async signTransaction(key, data) {
        if (typeof data == 'string') data = JSON.parse(data);
        this.log('signTransaction', '1/16', key, JSON.stringify(data));
        console.log('-')
        key = this.getPrivateKeyFromAny(key);
        this.log('signTransaction', '2/16');
        console.log('-')
        const wallet = new Ethers.Wallet(key);
        this.log('signTransaction', '3/16');
        console.log('-')
        let decimal = this.getInteger(data, ['decimal', 'decimals'], 18);
        this.log('signTransaction', '4/16', 'decimal', decimal);
        console.log('-')
        let from = wallet.address.toString();
        this.log('signTransaction', '5/16', 'from', from);
        console.log('-')
        let to = this.getString(data, ['tokenAddress', 'toAddress', 'to'])
        this.log('signTransaction', '6/16', 'to', to);
        console.log('-')
        let amount = this.getString(data, ['amount', 'value'], '0')
        this.log('signTransaction', '7/16', 'amount', amount);
        if (!this.strIsHex(amount)) {
            amount = new Decimal(amount).mul(Math.pow(10, decimal)).toHex();
        }
        this.log('signTransaction', '8/16', 'amount', amount);
        console.log('-')
        let nonce = new Decimal(this.getString(data, ['nonce'], '0')).toHex();
        this.log('signTransaction', '9/16', 'nonce', nonce);
        console.log('-')
        let inputData = this.getString(data, ['data'], '0x');
        this.log('signTransaction', '10/16', 'inputData', inputData);
        console.log('-')
        let gasLimit = this.getInteger(data, ['gasLimit'], 21000);
        this.log('signTransaction', '11/16', 'gasLimit', gasLimit);
        console.log('-')
        let gasPrice = this.getString(data, ['gasPrice'], '0');
        this.log('signTransaction', '12/16', 'gasPrice', gasPrice);
        if (!this.strIsHex(gasPrice)) {
            gasPrice = new Decimal(gasPrice).mul(Math.pow(10, decimal)).toHex();
        }
        this.log('signTransaction', '13/16', 'gasPrice', gasPrice);
        console.log('-')
        let chainId = this.getString(data, ['chainId'], `${this.chainId}`);
        this.log('signTransaction', '14/16', 'chainId', chainId);
        chainId = new Decimal(chainId).toNumber();
        this.log('signTransaction', '15/16', 'chainId', chainId);
        console.log('-')
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
        this.log('signTransaction', '15/16', 'Transaction', JSON.stringify(transaction));
        return new Promise((resolve, reject) => {
            wallet.signTransaction(transaction).then(result => {
                this.log('signTransaction', '16/16', 'result', result);
                resolve(result);
            }).catch(err => {
                this.log('signTransaction', '16/16', 'err', err.toString());
                reject(err);
            })
        });
    }

    async getNonce(address) {
        this.log('getNonce', '1/2', address);
        return new Promise((resolve, reject) => {
            this.callRPCServer(
                '/chain/nonce',
                {address})
                .then((result) => {
                    let temp = result.data.nonce
                    this.log('getNonce', '2/2', temp);
                    resolve(temp);
                })
                .catch((error) => {
                    this.log('getNonce', '2/2', error.toString());
                    reject(error)
                });
            // const eth = new Web3Eth(this.rpc);
            // eth.getTransactionCount(address, 'pending')
        })
    }

    async getBalance(address, contractAddress) {
        this.log('getBalance', '1/2', address, contractAddress);
        return new Promise((resolve, reject) => {
            // const eth = new Web3Eth(this.rpc);
            // eth.getBalance(address).then((result) => {
            //     resolve(result);
            // }).catch((error) => {
            //     reject(error)
            // });
            this.callRPCServer(
                '/coin/balance',
                {address, contractAddress})
                .then((result) => {
                    let temp = result.data.balance
                    this.log('getBalance', '2/2', temp);
                    resolve(temp);
                })
                .catch((error) => {
                    this.log('getBalance', '2/2', error.toString());
                    reject(error)
                });
        })
    }

    async getDecimals(contractAddress) {
        this.log('getDecimals', '1/2', contractAddress);
        return new Promise((resolve, reject) => {
            if (contractAddress) {
                // const contract = new Web3EthContract(mtoken, contractAddress);
                // contract.setProvider(this.rpc);
                // contract.methods.decimals().call().then((result) => {
                //     resolve(result);
                // }).catch((error) => {
                //     reject(error)
                // })
                this.callRPCServer(
                    '/coin/decimals',
                    {contractAddress})
                    .then((result) => {
                        let temp = result.data.decimals;
                        this.log('getDecimals', '2/2', temp);
                        resolve(temp);
                    })
                    .catch((error) => {
                        this.log('getDecimals', '2/2', error.toString());
                        reject(error)
                    });
            } else {
                this.log('getDecimals', '2/2', this.decimals);
                resolve(this.decimals);
            }
        })
    }

    async getGasPrice(params) {
        this.log('getGasPrice', '1/2', JSON.stringify(params));
        return new Promise(async (resolve, reject) => {
            // try {
            //     const eth = new Web3Eth(this.rpc);
            //     let gasPrice = await eth.getGasPrice();
            //     resolve(gasPrice)
            // } catch (error) {
            //     reject(error);
            // }
            this.callRPCServer(
                '/chain/gasPrice',
                {})
                .then((result) => {
                    let temp = result.data.gasPrice;
                    this.log('getGasPrice', '2/2', temp);
                    resolve(temp);
                })
                .catch((error) => {
                    this.log('getGasPrice', '2/2', error.toString());
                    reject(error)
                });

        })
    }

    async getFee(params) {
        this.log('getFee', '1/2', JSON.stringify(params));
        return new Promise(async (resolve, reject) => {
            this.callRPCServer(
                '/chain/fee',
                params)
                .then((result) => {
                    let temp = result.data;
                    this.log('getFee', '2/2', temp);
                    resolve(temp);
                })
                .catch((error) => {
                    this.log('getFee', '2/2', error.toString());
                    reject(error)
                });
        })
    }

    async getReceipt(hash) {
        this.log('getReceipt', '1/2', hash);
        return new Promise(async (resolve, reject) => {
            // try {
            //     const eth = new Web3Eth(this.rpc);
            //     let result = await eth.getTransactionReceipt(hash);
            //     resolve(result)
            // } catch (e) {
            //     reject(e)
            // }
            this.callRPCOrigin(
                {method: 'eth_getTransactionReceipt', params: [hash]})
                // const eth = new Web3Eth(this.rpc);
                // eth.getTransactionCount(address, 'pending')
                .then((result) => {
                    let temp = result.data.result;
                    this.log('getReceipt', '2/2', temp);
                    resolve(temp);
                })
                .catch((error) => {
                    this.log('getReceipt', '2/2', error.toString());
                    reject(error)
                });

        })
    }

    async callRPC(payload) {
        return new Promise((resolve, reject) => {
            let {method, params} = payload;
            let baseParams = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1};
            let requester = require('axios').default;
            let config = {
                method: 'post',
                url: this.rpc,
                headers: {
                    'Content-Type': 'application/json'
                },
                // adapter: fetchAdapter,
                data: baseParams
            };
            // @ts-ignore
            requester(config).then((result) => {
                if (result.data.error) {
                    reject(result.data.error);
                    return
                }
                resolve(result.data.result);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    async callRPCOrigin(payload) {
        var axios = require('axios');
        var data = JSON.stringify({
            "chainId": this.chainId,
            ...payload
        });
        console.log('callRPCOrigin', this.chainId, data)

        var config = {
            method: 'post',
            url: this.server + '/rpc/request',
            headers: {
                'Content-Type': 'application/json'
            },
            data
        };
        return new Promise((resolve, reject) => {

            axios(config)
                .then(function (response) {
                    console.log(JSON.stringify(response.data));
                    resolve(response.data)
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error)
                });

        })
    }

    async callRPCServer(path, payload) {
        var axios = require('axios');
        var data = JSON.stringify({
            "chainId": this.chainId,
            ...payload
        });
        //'Cookie': 'appid=97a183f8e0fd9f0629d30ceea2105dc0; cs=USDT'
        let timeNonce = new Date().getTime();
        let cookie = `appid=${this.appid}; nonce=${timeNonce};`
        if (this.uuid) {
            cookie = `${cookie} uuid=${this.uuid};`
        }
        if (this.platform) {
            cookie = `${cookie} platform=${this.platform};`
        }
        if (this.client_c) {
            cookie = `${cookie} client_c=${this.client_c};`
        }
        if (this.resolution) {
            cookie = `${cookie} resolution=${this.resolution};`
        }
        if (this.source) {
            cookie = `${cookie} source=${this.source};`
        }
        if (this.language) {
            cookie = `${cookie} language=${this.language};`
        }
        if (this.currency) {
            cookie = `${cookie} currency=${this.currency};`
        }
        if (this.cs) {
            cookie = `${cookie} cs=${this.cs};`
        }
        let sign = netSign(data, timeNonce, this.appkey);
        cookie=`${cookie} net_sign=${sign};`
        var config = {
            method: 'post',
            url: this.server + path,
            headers: {
                'Content-Type': 'application/json',
                'cookies': cookie
            },
            data,
            // withCredentials:true
        };
        this.log('CallRPCServer','cookie =>',cookie)
        this.log('CallRPCServer','data   =>', data)
        return new Promise((resolve, reject) => {

            axios(config)
                .then( (response) =>{
                    this.log('CallRPCServer',path,'Result   =>', JSON.stringify(response.data))
                    if (response.data.code != 0) {
                        reject(`${response.data.code}-${response.data.msg}`)
                    } else {
                        resolve(response.data)
                    }

                })
                .catch( (error) =>{
                    this.log('CallRPCServer',path,'Error   =>',error.toString())
                    reject(error)
                });

        })
    }
}

module.exports = EVM;
