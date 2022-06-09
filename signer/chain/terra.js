const Core = require('../group/core');
const Terra = require('@terra-money/terra.js');
const {MsgExecuteContract, MsgSend, Tx, TxBody,Fee,Coins} = require('@terra-money/terra.js');
const Decimal = require('decimal.js');
const {AuthInfo, SignerInfo, ModeInfo, Single} = require("@terra-money/terra.js/dist/core/Tx");
const {Any} = require("@terra-money/terra.proto/google/protobuf/any");
const Buffer = require('buffer/').Buffer
class TEMP extends Core {

    constructor() {
        super('LUNA');
    }

    async generateAccount() {
        let mk = new Terra.MnemonicKey();
        return {
            privateKey: mk.privateKey.toString('hex'),
            publicKey: mk.publicKey.address(),
            address: mk.accAddress.toString(),
            mnemonic: mk.mnemonic
        }
    }

    getPrivateKey(mnemonic) {
        const hdPrivateKey = this.getHDPrivateKey(mnemonic);
        const derived = hdPrivateKey.derive("m/44'/330'/0'/0/0");
        const privateKey = derived.privateKey.toString('hex');
        return privateKey;
    }

    setPrivateKey(key) {

        return this;
    }

    getAddress(key) {
        const isMnemonic = this.validateMnemonic(key);
        if (isMnemonic) {
            key = this.getPrivateKey(key);
        }

        try {
            key = this.formatPrivateKey(key);
            key = new Terra.RawKey(Buffer.from(key, 'hex'))
            return key.accAddress;
        } catch (e) {
            return '';
        }
    }

    formatPrivateKey(privateKey) {
        return privateKey;
    }

    validateAddress(address) {
        try {
            return address.startsWith('terra') && address.length === 44;
        } catch (e) {
            return false;
        }
    }

    validatePrivateKey(privateKey){return `${privateKey}`.length===64;}

    async signTransaction(key, data) {
        console.log('signTransaction ==>> ',JSON.stringify(data));
        return new Promise(async (resolve) => {
            try {
                const isMnemonic = this.validateMnemonic(key);
                if (isMnemonic) {
                    key = this.getPrivateKey(key);
                }
                key = this.formatPrivateKey(key);
                let wallet = new Terra.RawKey(Buffer.from(key, 'hex'))

                //TX ==> (body: TxBody, auth_info: AuthInfo, signatures: string[]);
                let chainId = (data["chainId"] || "columbus-5").toString();
                let account_number = data["account_number"];
                let sequence = data["sequence"];
                let timeout_height = data["timeout_height"];
                let memo = data["memo"] || "";

                let signerInfo = new SignerInfo(wallet.publicKey, sequence, new ModeInfo(new ModeInfo.Single({mode:1})))
                let tx;
                if (data['msgs']) {
                    let msgs = data['msgs'];
                    if (typeof data['msgs'] === 'string') {
                        msgs = JSON.parse(data['msgs']);
                    }
                    let fee = JSON.parse(data["fee"]);
                    let txBody = new TxBody(msgs, memo, timeout_height)
                    // let authInfo = new AuthInfo([signerInfo], fee);
                    let authInfo = new AuthInfo([], fee);
                    let txInfo = new Tx(txBody, authInfo, [wallet.accAddress]);
                    tx = await wallet.signTx(txInfo, {
                        accountNumber: account_number,
                        sequence: sequence,
                        signMode:new ModeInfo.Single({mode:1}),
                        chainID: chainId
                    });
                } else {
                    //fee,gas,feeCoin,to,coin,decimal,contract,data
                    //account_number,sequence,chainId
                    let fee = new Decimal(data['fee'] || '30000').toFixed(0);
                    let gas = new Decimal(new Decimal((data['gas'] || '200000')).toFixed(0)).toNumber();
                    let feeCoin = (data['feeCoin'] || 'uluna').toLowerCase();
                    let to = data['to'].toString();
                    let coin = data['coin'].toLowerCase();
                    let decimal = parseInt(data["decimal"] || '6');
                    let amount = new Decimal(data.value).mul(new Decimal('10').pow(decimal)).toFixed(0);
                    let contract = (data['contract'] || '').toLowerCase();
                    let contractAddress = (data['contract_address'] || '');
                    let inputData = data['data'] || '';
                    let msg;
                    let smpCoin=coin.startsWith("u")?coin:`u${coin}`;
                    let smpFeeCoin=feeCoin.startsWith("u")?feeCoin:`u${feeCoin}`;

                    if (contract && contractAddress.startsWith("terra")) {
                        if (typeof inputData ==='string'){
                            // inputData = JSON.parse(inputData);
                            let step2 = Buffer.from(inputData, 'base64').toString();
                            step2 = JSON.parse(step2);
                            console.log('Contract Send step2==>', step2, '\n--------------------------\n');
                            // try {
                            //     var any = Any.fromJSON({value: step2});
                            //     console.log('Contract Send step2==>', any, '\n--------------------------\n');
                            // } catch (e) {
                            //     console.log('Sign Error00-1 ==>',e.toString(),inputData,'\n--------------------------\n');
                            // }
                            try {
                                // msg = MsgExecuteContract.unpackAny(any);
                                msg = MsgExecuteContract.fromData(step2);
                                console.log('Contract Send ==>', JSON.stringify(msg), '\n--------------------------\n');
                            } catch (e) {
                                console.log('Sign Error00 ==>',e.toString(),inputData,'\n--------------------------\n');
                                resolve('')
                            }
                        }else{
                            msg = new MsgExecuteContract(
                                wallet.accAddress,
                                contractAddress,
                                inputData
                            );
                            console.log('Normal01 Send ==>',JSON.stringify(msg),'\n--------------------------\n');
                        }

                    } else {
                        msg = new MsgSend(wallet.accAddress, to, `${amount}${smpCoin}`);
                        console.log('Normal02 Send ==>',JSON.stringify(msg),'\n--------------------------\n');
                    }
                    let txFee = new Fee(gas,Coins.fromString(`${fee}${smpFeeCoin}`))
                    let txBody = new TxBody([msg], memo, timeout_height)
                    let authInfo = new AuthInfo([], txFee);
                    let txInfo = new Tx(txBody, authInfo,[]);
                    tx = await wallet.signTx(txInfo, {
                        accountNumber: account_number,
                        sequence: sequence,
                        signMode: new ModeInfo.Single({mode:1}),
                        chainID: chainId
                    });
                    console.log('Sign Result ==>',JSON.stringify(tx),'\n--------------------------\n');
                }
                try {
                    let bytes = tx.toBytes();
                    let result = Buffer.from(bytes).toString('base64');
                    resolve(result)
                } catch (e) {
                    console.log('Sign Error01 ==>',e.toString(),'\n--------------------------\n');
                    resolve('')
                }
            } catch (e) {
                console.log('Sign Error02 ==>',e.toString(),'\n--------------------------\n');
                resolve('')
            }
        });
    }

}

module.exports = new TEMP();
