const Core = require('../group/core');
const TronWeb = require('tronweb');
const Ethers = require('ethers');

class TEMP extends Core {

    constructor() {
        super('TRX');
        this.tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io',
            headers: {"TRON-PRO-API-KEY": '629698e9-c72a-4f34-9cfb-3c6f9daae688', 'Content-Type': 'application/json'},
        })
    }

    async getContract(address,abi){
        if (abi){
            return await this.tronWeb.contract(abi,address);
        }
        return await this.tronWeb.contract().at(address);
    }

    async generateAccount() {
        let result = await this.tronWeb.createAccount()
        return {
            privateKey: result.privateKey,
            publicKey: result.publicKey,
            address: result.address.base58
        }
    }

    getPrivateKey(mnemonic) {
        const hdPrivateKey = this.getHDPrivateKey(mnemonic);
        const derived = hdPrivateKey.derive("m/44'/195'/0'/0/0");
        const privateKey = derived.privateKey.toString('hex');
        return privateKey;
    }
    setPrivateKey(key) {
        this.tronWeb.setPrivateKey(key);
        return this;
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

    getPrivateKeyFromKeystore(json, password) {
        return super.getPrivateKeyFromKeystore(json, password);
    }

    getAddress(key) {
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic) {
            key = this.getPrivateKey(key);
        }

        try {
            key = this.formatPrivateKey(key);
            this.tronWeb.setPrivateKey(key);
            let result = this.tronWeb.defaultAddress
            return result.base58;
        } catch (e) {
            return '';
        }
    }

    formatPrivateKey(privateKey) {
        if (privateKey) {
            if (privateKey.indexOf('0x') === 0 || privateKey.indexOf('0X') === 0) {
                return privateKey.substr(2);
            }
            return privateKey;
        }
        return '';
    }

    validateAddress(address) {
        return this.tronWeb.isAddress(address)
    }

    async signTransaction(key, data) {
        // console.log('TRX signTransaction 000000', JSON.stringify(data))
        return new Promise(async (resolve) => {
            try {
                const isMnemonic = this.validateMnemonic(key);
                if (isMnemonic) {
                    key = this.getPrivateKey(key);
                }
                key = this.formatPrivateKey(key);
                this.tronWeb.setPrivateKey(key);
                let tokenData = data['data'];
                let assetName = data['assetName'];
                // console.log('TRX signTransaction DATA ' + `assetName:${assetName} ${typeof data} ` + JSON.stringify(data))
                let signobj = {};
                if (tokenData) {
                    // console.log('TRX signTransaction 1111 sendToken ',tokenData)
                    if ((typeof tokenData == 'string')) {
                        tokenData = JSON.parse(tokenData);
                    }
                    // console.log('TRX signTransaction 1111-01 sendToken ==> '+JSON.stringify(tokenData))
                    if (tokenData.transaction) {
                        signobj = tokenData.transaction;
                    } else {
                        signobj = tokenData;
                    }
                } else if (assetName && assetName !== '') {
                    // console.log('TRX signTransaction 2222 sendTRX-TRC10')
                    let to = data['to'] ? data['to'] : data['toAddress']
                    let value = data['value'] ? data['value'] : data['amount'] ? data['amount'] : 0;
                    value = this.tronWeb.toSun(value)
                    // console.log('TRX signTransaction 2222-1 sendTRX-TRC10' + `${typeof value} ${JSON.stringify({
                    //     to,
                    //     value
                    // })}`)
                    let account = await this.tronWeb.trx.getAccount()
                    // console.log('TRX signTransaction 2222-2 sendTRX-TRC10' + `${JSON.stringify(account)}`)
                    try {
                        signobj = await this.tronWeb.transactionBuilder.sendToken(to, value, assetName, account.address);
                    } catch (e) {
                        console.log(e)
                    }
                    // console.log('TRX signTransaction 2222-3 sendTRX-TRC10' + `${JSON.stringify(signobj)}`, {to, value})
                } else {
                    // console.log('TRX signTransaction 2222 sendTRX')
                    let to = data['to'] ? data['to'] : data['toAddress']
                    let value = data['value'] ? data['value'] : data['amount'] ? data['amount'] : 0;
                    value = this.tronWeb.toSun(value)
                    // console.log('TRX signTransaction 2222-1 sendTRX', {to, value})
                    let account = await this.tronWeb.trx.getAccount()
                    // console.log('TRX signTransaction 2222-2 sendTRX', {to, value})
                    signobj = await this.tronWeb.transactionBuilder.sendTrx(to, value, account.address);
                    // console.log('TRX signTransaction 2222-3 sendTRX', {to, value})

                }
                // console.log('TRX signTransaction 3333 sendTRX', JSON.stringify(signobj))
                const signedtxn = await this.tronWeb.trx.sign(signobj);
                // console.log('TRX signTransaction 4444 sendTRX', JSON.stringify(signedtxn))
                // let result = await this.tronWeb.trx.sendRawTransaction(signedtxn);
                // console.log('TRX signTransaction 5555 sendTRX', JSON.stringify(result))
                resolve(JSON.stringify(signedtxn))
            } catch (e) {
                resolve('')
            }
        });
    }
}

module.exports = new TEMP();
