const Group =require('../group/evm')

const bip39 = require('bip39')
const bs58 = require('bs58');
const Tweetnacl = require('tweetnacl');
const Transfer = require('../libs/solana/transfer');
const { Keypair, PublicKey ,LAMPORTS_PER_SOL, Message, Transaction} = require('@solana/web3.js');
const ed25519 = require("ed25519-hd-key");


class TEMP extends Group{

    constructor() {
        super('SOL',1,'https://solana-api.projectserum.com/');
        this.derivePath = `m/44'/501'/0'/0'`
    }

    async generateAccount() {
        let mnemonic = this.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic)
        const derivedSeed = ed25519.derivePath(this.derivePath, seed).key
        const mm = derivedSeed.toString('hex');
        let account = Keypair.fromSeed(Buffer.from(mm, 'hex'));

        return {
            address:account.publicKey.toString(),
            privateKey:bs58.encode(account.secretKey),
            mnemonic:{
                phrase:mnemonic,
                path:this.derivePath,
                locale:'en'
            }
        }
    }

    async getPrivateKey(mnemonic) {
        return new Promise(async resolve => {
            const seed = await bip39.mnemonicToSeed(mnemonic)
            // console.log('getPrivateKey 01',mnemonic)
            const derivedSeed = ed25519.derivePath(this.derivePath, seed).key
            // console.log('getPrivateKey 02',mnemonic)
            const mm = derivedSeed.toString('hex');
            // console.log('getPrivateKey 03',mnemonic)
            let account = Keypair.fromSeed(Buffer.from(mm, 'hex'));
            // console.log('getPrivateKey 04',mnemonic)
            let pk=bs58.encode(account.secretKey);
            // console.log('getPrivateKey 05',mnemonic,pk)
            resolve(pk)
        })
    }

    getPublicKey(key) {
        return this.getAddress(key);
    }

    getAddress(key) {
        let privateKey = this.getPrivateKeyFromAny(key);
        console.log("Sol getAddress 01 =>",privateKey)
        console.log("Sol getAddress 01-1 =>",privateKey.length)
        let isPK = this.validatePrivateKey(privateKey);
        console.log("Sol getAddress 02 =>",isPK)
        if (!isPK){
            return '';
        }

        let account = Keypair.fromSecretKey( Uint8Array.from(bs58.decode(privateKey)));
        // console.log(account.publicKey.toString())
        // const account = Keypair.fromSeed(new Uint8Array(bs58.decode(privateKey)));
        return account.publicKey.toString();
    }

    validateAddress(address) {
        try {
            bs58.decode(address)
            return true;
        } catch (e) {
        }
        return false;
    }

    validatePrivateKey(privateKey){
        if (!privateKey){
            return false;
        }
        if (typeof privateKey ==='string'){
            privateKey=Uint8Array.from(bs58.decode(privateKey));
        }
        return privateKey.length === 64 || privateKey.length === 128;
    }

    /**
     * signData        ['signData']
     * to              ['tokenAddress','toAddress','to']
     * amount          ['amount','value']
     * decimal         ['decimal','decimals']
     * contract        ['contract']
     * fromSource      ['fromSource']
     * toSource        ['toSource']
     * memo            ['memo']
     * recentBlockhash ['recentBlockhash']
     *
     *
     * @param key
     * @param data
     * @returns {Promise<string>}
     */
    async signTransaction(key, data) {
        key = this.getPrivateKeyFromAny(key);
        return  new Promise(async (resolve,reject) => {
            //Uint8Array.from(bs58.decode(key))
            const wallet = Keypair.fromSecretKey( Uint8Array.from(bs58.decode(key)));
            if (data['signData']){
                data = data['signData'];
                let signData;
                if(data.hex) {
                    signData = Buffer.from(data.hex, 'hex');
                } else if(data.message){
                    signData = bs58.decode(data.message);
                }
                if(!signData) {reject(new Error('Unkonwn sign data'));}
                const signature = Tweetnacl.sign.detached(signData, wallet.secretKey);
                resolve(Buffer.from(signature).toString('hex'));
            }else if (data['data']||data['inputData']){
                let sign = data['data']?data['data']:data['inputData'];
                let signData  = bs58.decode(sign);
                let message = Message.from(signData);
                let transaction = Transaction.populate(message);
                let recentBlockhash = this.getString(data,['recentBlockhash']);
                if(recentBlockhash){
                    transaction.recentBlockhash = this.getString(data,['recentBlockhash']);
                }
                transaction.feePayer = wallet.publicKey;
                transaction.sign(wallet);
                sign = transaction.serialize().toString('base64')
                resolve(sign);
            }else{
                const fromPubkey = new PublicKey(wallet.publicKey);
                let to = this.getString(data,['tokenAddress','toAddress','to']);
                const toSourcePublic = new PublicKey(to);
                let amount = this.getString(data,['amount','value'],'0');
                amount = parseFloat(amount);
                let decimal = this.getInteger(data,['decimal','decimals'],9);
                let decimalNum = Math.pow(10, decimal);
                console.log(`${this.name} | SignTransaction | ${to} | ${decimal} | ${decimalNum} | ${amount}`,JSON.stringify(data))
                let contractStr = this.getString(data,['contract'],null);
                let contractAddress = this.getString(data,['contractAddress'],null);
                amount = Math.round(amount * decimalNum);
                let transaction;
                //transfer sol
                if (!contractAddress){
                    transaction = new Transfer().trnasfer(fromPubkey, toSourcePublic,amount);
                }else{
                    throw new Error('can not support contract sign')
                }
                transaction.recentBlockhash = this.getString(data,['recentBlockhash']);
                transaction.feePayer = fromPubkey;
                transaction.sign(wallet);
                resolve(transaction.serialize().toString('base64'));
            }
        });


    }

}

module.exports=new TEMP();
