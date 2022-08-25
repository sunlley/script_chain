const Mnemonic = require('bitcore-mnemonic');
const Web3Utils = require("web3-utils");

class TEMP{

    constructor(name,server,config){
        this.name = name;
        this.server =server;
        this.debug=false;
        this.updateConfig(config)
    }
    updateConfig(config){
        if (config){
            this.appid = config.appid?config.appid:this.appid;
            this.appkey = config.appkey?config.appkey:this.appkey;
            this.uuid = config.uuid?config.uuid:this.uuid;
            this.platform = config.platform?config.platform:this.platform;
            this.client_c = config.client_c?config.client_c:this.client_c;
            this.resolution = config.resolution?config.resolution:this.resolution;
            this.source = config.source?config.source:this.source;
            this.debug = config.debug?config.debug:this.debug;
            this.language = config.language?config.language:this.language;
            this.currency = config.currency?config.currency:this.currency;
            this.cs = config.cs?config.cs:this.cs;
        }
    }

    async generateAccount(key){
        return {};
    }

    generateMnemonic(){
        return  new Mnemonic().toString();
    }

    /**
     * @param key mnemonic or privateKey
     * @param password
     * @returns {Promise<string>}
     */
    async getKeystore(key,password){return''}

    getPrivateKeyFromAny(key,other) {
        return '';
    }

    getPrivateKeyFromKeystore(json,password){return ''}

    getSeedHex(mnemonic){return''}

    getHDPrivateKey(mnemonic){
        const BM= new Mnemonic(mnemonic);
        return BM.toHDPrivateKey();
    }

    getPrivateKey(mnemonic){
        return '';
    }

    /**
     *
     * @param key mnemonic or privateKey
     * @returns {string}
     */
    getPublicKey(key){return''}

    /**
     *
     * @param key mnemonic or privateKey
     * @returns {string}
     */
    getAddress(key){return''}

    validateAddress(address){
        return false;
    }

    validateMnemonic(mnemonic){
        if(!mnemonic) return false;
        try {
            mnemonic = mnemonic.trim();
        } catch (e) {
            return false;
        }
        return Mnemonic.isValid(mnemonic);
    }

    validatePrivateKey(privateKey){return false}

    /**
     * @param key mnemonic or privateKey
     * @param message
     * @returns {Promise<string>}
     */
    async signMessage(key, message){return''}

    /**
     *
     * @param key mnemonic or privateKey
     * @param data
     * @returns {Promise}
     */
    async signTransaction(key,data){return new Promise();}

    /**
     * @param data
     * @returns {Promise<void>}
     */
    async send(data){}

    formatMnemonic(mnemonic){
        if(!mnemonic) return "";
        mnemonic = mnemonic.trim();
        let arrs = mnemonic.split(' ');
        let res = [];
        for(var i = 0; i < arrs.length; i++){
            if(arrs[i]) res.push(arrs[i]);
        }
        return res.join(' ');
    }

    formatDapp(data){
        //解析Dapp的数据
        if(typeof data == 'string') data = JSON.parse(data);
        return data;
    }

    strIsEmpty(str){
        if (str===undefined){
            return true;
        }
        if (str==null){
            return true;
        }
        return str === '';

    }
    getString(data,keys,defaultValue=''){
        if (keys==null || keys.length===0){
            return defaultValue;
        }
        for (let i = 0; i < keys.length; i++) {
            let item = data[keys[i]];
            if (!this.strIsEmpty(item)){
                return item;
            }
        }
        return defaultValue;
    }
    getInteger(data,keys,defaultValue=0){
        if (keys==null || keys.length===0){
            return defaultValue;
        }
        for (let i = 0; i < keys.length; i++) {
            let item = data[keys[i]];
            if (!isNaN(item)){
                try {
                    return parseInt(`${item}`)
                } catch (e) {
                }
            }
        }
        return defaultValue;
    }
    getFloat(data,keys,defaultValue=0.0){
        if (keys==null || keys.length===0){
            return defaultValue;
        }
        for (let i = 0; i < keys.length; i++) {
            let item = data[keys[i]];
            if (!isNaN(item)){
                try {
                    return parseFloat(`${item}`)
                } catch (e) {
                }
            }
        }
        return defaultValue;
    }
    hextonumberstring(str,defaultValue='0'){
        if (str &&str.indexOf("0x")==0 &&   Web3Utils.isHex(str)){
            return Web3Utils.hexToNumberString(str);
        }
        if (!isNaN(str)){
            return `${str}`;
        }
        return defaultValue;
    }
    strIsHex(str){
        if (isNaN(str)){
            return false;
        }
        return str.indexOf('0x')==0;
    }
}

module.exports = TEMP
