const Crypto = require('./util/crypto')
const CryptoJS = require('crypto-js')
const {randomString} = require('./util/utils')
const UrlEncode = require('urlencode');
const Decimals = require('decimal.js')

// const TRX = require('./chain/trx');
const Group = require('./group/evm');

const {encodeShard, decodeShard} = require('./libs/sss')


var ROOT = null;
try {
    ROOT = window;
} catch (e) {
}
if (!ROOT) {
    ROOT = {};
}


const Log = function () {
    if (ROOT.BeFi.debug){
        console.log(...arguments);
    }
}

ROOT.BeFi = {
    chains: {},
    appid: "",
    appkey: "",
    license: "",
    debug:true
}

ROOT.__jMessageCallbacks = {};
ROOT.__jRequestCallbacks = {};
ROOT.__JSMESSAGE = function (id, data) {
    if (ROOT.__jRequestCallbacks[id]) {
        ROOT.__jRequestCallbacks[id](data);
    }
}

function jsRequest(data, callback) {
    let id = randomString(12);
    data.id = id;
    ROOT.__jRequestCallbacks[id] = function (code, message, data) {
        if (callback) {
            callback(code, message, data)
        }
    }
    if (ROOT.__JSHOST) {
        ROOT.__JSHOST.sendRequest(JSON.stringify(data));
    } else if (ROOT.webkit && ROOT.webkit.messageHandlers) {
        //[cmd, id, chain, data]
        data = [data.method, id, data.data];
        ROOT.webkit.messageHandlers.__JSHOST.sendRequest(JSON.stringify(data));
    } else {

    }

}

function jsCallback(id, data) {

    if (ROOT.__JSHOST) {
        ROOT.__JSHOST.postMessage(JSON.stringify({
            method: "ScriptBack",
            id: id,
            data: data
        }));
    } else if (ROOT.webkit && ROOT.webkit.messageHandlers) {
        //[cmd, id, chain, data]
        // data = ['scriptBack', id, data];
        ROOT.webkit.messageHandlers.__JSHOST.postMessage(JSON.stringify({
            method: "ScriptBack",
            id: id,
            data: data
        }));
    } else {

    }

}

function matchCore(...params) {
    for (let param of params) {
        if (param) {
            if (param && ROOT.BeFi.chains[param]) {
                return ROOT.BeFi.chains[param];
            }
        }
    }
    return null
}

function wrapEntity(code, msg, data = {}) {
    return {
        code: code,
        msg: msg,
        data: data
    }
}

function wrapError(error, defaultCode, defaultMessage) {
    let code = defaultCode;
    let msg = defaultMessage;
    if (error) {
        let message = error.toString();
        if (message.indexOf('-') > 0) {
            let temp = message.split('-');
            if (temp.length > 1) {
                code = temp[0];
                msg = temp[1];
            }
        }
    }
    return {
        code,
        msg,
        data: {}
    }
}

function matchLicense() {
    return true;
    try {
        let cry = new Crypto(ROOT.BeFi.appkey, ROOT.BeFi.appid);
        let license = UrlEncode.decode(ROOT.BeFi.license);
        let start = license.indexOf("Hex") + 3;
        let end = license.indexOf('Expired');
        license = license.substr(start, end - start).trim().substr(2)
        let ts = cry.decrypt(license);
        ts = cry.licenseTS(ts);
        let now = new Date().getTime();
        return now < ts;
    } catch (e) {
        return false;
    }
}

function getMnemonic(data, core) {
    try {
        return wrapEntity(0, 'success', core.generateMnemonic());
    } catch (e) {
        return wrapError(e, 110, 'getMnemonic failed ' + e.toString())
    }
}

async function callRPC(data, core) {
    try {
        return wrapEntity(0, 'success', await core.callRPC(data));
    } catch (e) {
        return wrapError(e, 110, 'callRPC failed ' + e.toString())
    }
}

async function getReceipt(data, core) {
    if (!data['hash']) {
        return wrapEntity(101, 'No Params [getReceipt] [hash]');
    }
    try {
        return wrapEntity(0, 'success', await core.getReceipt(data['hash']));
    } catch (e) {
        return wrapError(e, 110, 'getReceipt failed ' + e.toString())
    }
}

async function getGasPrice(data, core) {
    try {
        return wrapEntity(0, 'success', await core.getGasPrice(data));
    } catch (e) {
        return wrapError(e, 110, 'getGasPrice failed ' + e.toString())
    }
}

async function getFee(data, core) {
    try {
        return wrapEntity(0, 'success', await core.getFee(data));
    } catch (e) {
        return wrapError(e, 110, 'getFee failed ' + e.toString())
    }
}

async function getDecimals(data, core) {
    try {
        return wrapEntity(0, 'success', await core.getDecimals(data['contractAddress']));
    } catch (e) {
        return wrapError(e, 110, 'getDecimals failed ' + e.toString())
    }
}

async function getNonce(data, core) {
    if (!data['address']) {
        return wrapEntity(101, 'No Params [getNonce] [address]');
    }
    try {
        return wrapEntity(0, 'success', await core.getNonce(data['address']));
    } catch (e) {
        return wrapError(e, 110, 'getNonce failed ' + e.toString())
    }
}

async function getBalance(data, core) {
    if (!data['address']) {
        return wrapEntity(101, 'No Params [getBalance] [address]');
    }
    try {
        return wrapEntity(0, 'success', await core.getBalance(data['address'], data['contractAddress']));
    } catch (e) {
        return wrapError(e, 110, 'getBalance failed ' + e.toString())
    }
}

async function getKeystore(data, core) {
    if (!data['password']) {
        return wrapEntity(101, 'No Params [getKeystore] [password]');
    }
    try {
        return wrapEntity(0, 'success', await core.getKeystore(data['privateKey'], data['password']));
    } catch (e) {
        return wrapError(e, 110, 'getKeystore failed ' + e.toString())
    }
}

async function getAccount(data, core) {
    try {
        return wrapEntity(0, 'success', await core.generateAccount(data['privateKey'] || data['mnemonic']));
    } catch (e) {
        return wrapError(e, 110, 'getAccount failed ' + e.toString())
    }
}

async function getPrivateKey(data, core) {

    if (!data['mnemonic'] && !data['keystore']) {
        return wrapEntity(101, 'No Params [getPrivateKey] [mnemonic and keystore]');
    }
    try {
        if (data['mnemonic'] && data['mnemonic'] !== '') {
            let privateKey = await core.getPrivateKey(data['mnemonic'])
            return wrapEntity(0, 'success', privateKey);
        } else {
            if (!data['password']) {
                return wrapEntity(101, 'No Params [getPrivateKey] [password]');
            }
            let keystore = UrlEncode.decode(data['keystore']);
            return wrapEntity(0, 'success', core.getPrivateKeyFromKeystore(keystore, data['password']));
        }

    } catch (e) {
        return wrapError(e, 110, 'getPrivateKey failed ' + e.toString())
    }
}

function getPublicKey(data, core) {

    if (!data['privateKey'] && !data['mnemonic']) {
        return wrapEntity(101, 'No Params [getPublicKey] [privateKey or mnemonic]');
    }

    try {
        return wrapEntity(0, 'success', core.getPublicKey(data['privateKey'] || data['mnemonic']));
    } catch (e) {
        return wrapError(e, 110, 'getPublicKey failed ' + e.toString())
    }
}

function getAddress(data, core) {
    if (!data['privateKey'] && !data['mnemonic']) {
        return wrapEntity(101, 'No Params [getAddress] [privateKey or mnemonic]');
    }
    try {
        return wrapEntity(0, 'success', core.getAddress(data['privateKey'] || data['mnemonic']));
    } catch (e) {
        return wrapError(e, 110, 'getAddress failed ' + e.toString())
    }
}

function validateAddress(data, core) {

    if (!data['address']) {
        return wrapEntity(101, 'No Params [validateAddress] [address]');
    }

    try {
        return wrapEntity(0, 'success', core.validateAddress(data['address']).toString());
    } catch (e) {
        return wrapError(e, 110, 'validateAddress failed ' + e.toString())
    }
}

function validatePrivateKey(data, core) {
    if (!data['privateKey']) {
        return wrapEntity(101, 'No Params [validatePrivateKey] [privateKey]');
    }
    try {
        return wrapEntity(0, 'success', core.validatePrivateKey(data['privateKey']).toString());
    } catch (e) {
        return wrapError(e, 110, 'validatePrivateKey failed ' + e.toString())
    }
}

function validateMnemonic(data, core) {
    if (!data['mnemonic']) {
        return wrapEntity(101, 'No Params [validateMnemonic] [mnemonic]');
    }

    try {
        return wrapEntity(0, 'success', core.validateMnemonic(data['mnemonic']).toString());
    } catch (e) {
        return wrapError(e, 110, 'validateMnemonic failed ' + e.toString())
    }
}

function encodeERC20ABI(data, core) {
    try {
        return wrapEntity(0, 'success', core.encodeERC20ABI(data));
    } catch (e) {
        return wrapError(e, 110, 'encodeERC20ABI failed ' + e.toString())
    }
}

async function signMessage(data, core) {

    if (!data['privateKey'] && !data['mnemonic']) {
        return wrapEntity(101, 'No Params [signMessage] [privateKey and mnemonic]');
    }
    if (!data['message']) {
        return wrapEntity(101, 'No Params [signMessage] [message]');
    }
    try {
        let privateKey = data['privateKey'];
        if (!privateKey) {
            let mnemonic = data['mnemonic'];
            if (!mnemonic) {
                return wrapEntity(101, 'No Params [signMessage] [mnemonic]');
            }
            privateKey = await core.getPrivateKey(mnemonic);
            data['privateKey'] = privateKey;
        }
        return wrapEntity(0, 'success', await core.signMessage(data['privateKey'], data['message']));
    } catch (e) {
        return wrapError(e, 110, 'signMessage failed ' + e.toString())
    }
}

async function signTransaction(data, core) {
    if (!data['privateKey'] && !data['mnemonic']) {
        return wrapEntity(101, 'No Params [signTransaction] [privateKey and mnemonic]');
    }
    try {
        let result = await core.signTransaction(data['privateKey'] != null ? data['privateKey'] : data['mnemonic'], data);
        return wrapEntity(0, 'success', result);
    } catch (e) {
        return wrapError(e, 110, 'signTransaction failed ' + e.toString())
    }
}

function formatDapp(data, core) {

    if (!data['data']) {
        return wrapEntity(101, 'No Params [formatDapp] [data]');
    }

    try {
        return wrapEntity(0, 'success', core.formatDapp(data['data']));
    } catch (e) {
        return wrapError(e, 110, 'formatDapp failed ' + e.toString())
    }
}

function encodeAuth(params) {

    let {message, uuid} = params;
    let cry = new Crypto(ROOT.BeFi.appkey, ROOT.BeFi.appid);
    let auth = cry.encrypt(message, uuid);
    return auth;
}

function decodeAuth(params) {

    let {message, uuid} = params;
    let cry = new Crypto(ROOT.BeFi.appkey, ROOT.BeFi.appid);
    let auth = cry.decrypt(message, uuid);
    return auth;
}

function encodeMessage(params) {
    let {message, password} = params;
    // let cry = new Crypto(ROOT.BeFi.appkey, ROOT.BeFi.appid);
    // let auth = cry.encrypt(password);
    let ciphertext = CryptoJS.AES.encrypt(message, password).toString();
    return ciphertext;

}

function decodeMessage(params) {
    let {message, password} = params;
    // let cry = new Crypto(ROOT.BeFi.appkey, ROOT.BeFi.appid);
    // let auth = cry.encrypt(password);
    let bytes = CryptoJS.AES.decrypt(message, password);
    let originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}

function toHex(params) {
    let {value, decimals} = params;
    if (decimals) {
        return new Decimals(`${value}`).mul(new Decimals(10).pow(decimals)).toHex()
    } else {
        return new Decimals(`${value}`).toHex()
    }

}

let CHAIN_METHODS = {

    'getMnemonic': {method: getMnemonic, type: 'normal'},
    'getPublicKey': {method: getPublicKey, type: 'normal'},
    'getAddress': {method: getAddress, type: 'normal'},
    'validateAddress': {method: validateAddress, type: 'normal'},
    'validatePrivateKey': {method: validatePrivateKey, type: 'normal'},
    'validateMnemonic': {method: validateMnemonic, type: 'normal'},
    'formatDapp': {method: formatDapp, type: 'normal'},
    'encodeERC20ABI': {method: encodeERC20ABI, type: 'normal'},

    'callRPC': {method: callRPC, type: 'block'},
    'getDecimals': {method: getDecimals, type: 'block'},
    'getReceipt': {method: getReceipt, type: 'block'},
    'getGasPrice': {method: getGasPrice, type: 'block'},
    'getFee': {method: getFee, type: 'block'},
    'getBalance': {method: getBalance, type: 'block'},
    'getNonce': {method: getNonce, type: 'block'},
    'getPrivateKey': {method: getPrivateKey, type: 'block'},
    'signMessage': {method: signMessage, type: 'block'},
    'signTransaction': {method: signTransaction, type: 'block'},
    'getKeystore': {method: getKeystore, type: 'block'},
    'getAccount': {method: getAccount, type: 'block'},
}
let SSS_METHODS = {
    'encodeShard': {method: encodeShard, type: 'normal'},
    'decodeShard': {method: decodeShard, type: 'normal'},

}
let NORMAL_METHODS = {
    'encodeAuth': {method: encodeAuth, type: 'normal'},
    'decodeAuth': {method: decodeAuth, type: 'normal'},
    'encodeMessage': {method: encodeMessage, type: 'normal'},
    'decodeMessage': {method: decodeMessage, type: 'normal'},
    'toHex': {method: toHex, type: 'normal'},

}

/*
 * 100  not support
 * 110  option err
 * 101  params err
 * 105  license AUTH err
 */
function callChain(data) {
    let method = data['method'];
    let jsid = data['jsid'];
    let result = null;
    let methodContainer = CHAIN_METHODS[method];
    if (methodContainer == null) {
        result = wrapEntity(100, 'not support this method:' + method);
        jsCallback(jsid, result);
    }
    let core = matchCore(data['chainId']);
    if (core == null) {
        if (data['chainId'] != null) {
            result = wrapEntity(100, 'not support this chain:' + data['chainId']);
            jsCallback(jsid, result);
            return
        }
    }
    let methodFunc = methodContainer.method;
    if (methodContainer.type === 'block') {
        methodFunc(data, core)
            .then(function (result) {
                jsCallback(jsid, result);
            })
            .catch(function (error) {
                result = wrapEntity(110, `Call ${method} error: ` + error.message);
                jsCallback(jsid, result);
            });
    } else {
        result = methodFunc(data, core);
        jsCallback(jsid, result);
    }
}

function callSSS(data) {
    let method = data['method'];
    let jsid = data['jsid'];
    let shards = data['shards'];
    let result = null;
    if (shards == null) {
        result = wrapEntity(101, `Method ${method} need params [shards]`);
        jsCallback(jsid, result);
        return
    }

    let methodContainer = SSS_METHODS[method];
    let methodFunc = methodContainer.method;
    if (methodContainer.type === 'block') {
        methodFunc(data)
            .then(function (result) {
                jsCallback(jsid, wrapEntity(0, 'success', result));
            })
            .catch(function (error) {
                result = wrapEntity(110, `Call ${method} error: ` + error.message);
                jsCallback(jsid, result);
            });
    } else {
        try {
            result = methodFunc(data);
            jsCallback(jsid, wrapEntity(0, 'success', result));
        } catch (error) {
            result = wrapEntity(110, `Call ${method} error: ` + error.message);
            jsCallback(jsid, result);
        }
    }
}

function callNormal(data) {
    let method = data['method'];
    let jsid = data['jsid'];

    let methodContainer = NORMAL_METHODS[method];
    let methodFunc = methodContainer.method;
    let result = null;
    if (methodContainer.type === 'block') {
        methodFunc(data)
            .then(function (result) {
                jsCallback(jsid, wrapEntity(0, 'success', result));
            })
            .catch(function (error) {
                result = wrapEntity(110, `Call ${method} error: ` + error.message);
                jsCallback(jsid, result);
            });
    } else {
        try {
            result = methodFunc(data);
            jsCallback(jsid, wrapEntity(0, 'success', result));
        } catch (error) {
            result = wrapEntity(110, `Call ${method} error: ` + error.message);
            jsCallback(jsid, result);
        }
    }
}

/*
 * 100  not support
 * 110  option err
 * 101  params err
 * 105  license AUTH err
 */
ROOT.request = function (data) {

    if (!matchLicense()) {
        return wrapEntity(105, `License expired ${data}`);
    }
    if (typeof data === 'object') {
    }
    if (typeof data === 'string') {
        if (data.trim().indexOf("{") < 0) {
            throw new Error('Params error');
        }
        data = JSON.parse(data);
    }

    let jsid = data['jsid'];
    let method = data['method'];
    Log('BeFi JS-CORE', "Request", method, JSON.stringify(data));
    if (!method) {
        throw new Error('Params error: no method find!');
    }
    if (!jsid) {
        throw new Error('Params error: no jsid find!');
    }
    if (NORMAL_METHODS[method]) {
        callNormal(data)
    } else if (SSS_METHODS[method]) {
        callSSS(data);
    } else {
        callChain(data);
    }
}

ROOT.init = function (data) {
    if (typeof data === 'object') {
        data = JSON.stringify(data);
    }
    if (!data && !data.startsWith('{')) {
        return wrapEntity(101, "params has no '{' ");
    }
    let params = JSON.parse(data);
    ROOT.BeFi.chains = {};
    ROOT.BeFi.appkey = params.appkey;
    ROOT.BeFi.appid = params.appid;
    ROOT.BeFi.license = params.license;
    ROOT.BeFi.platform = params.platform;
    ROOT.BeFi.debug = params.debug?params.debug:false;
    for (const chainId in params.chains) {
        let chain = params.chains[chainId];
        if (chain) {
            ROOT.BeFi.chains[chainId] = new Group(
                chain.chainName,
                params.server,
                chain.chainId,
                chain.rpc,
                chain.decimals,
                {
                    appid: params.appid,
                    appkey: params.appkey,
                    uuid: params.uuid,
                    platform: params.platform,
                    client_c: params.client_c,
                    resolution: params.resolution,
                    source: params.source,
                    debug: params.debug?params.debug:false,
                }
            )
        }
    }
    Log("ROOT.params", JSON.stringify(params))
    Log("ROOT.BeFi", JSON.stringify(ROOT.BeFi))

}
ROOT.updateConfig=function (data){
    Log("ROOT.updateConfig", JSON.stringify(data))
    if (typeof data === 'object') {
        data = JSON.stringify(data);
    }
    if (!data && !data.startsWith('{')) {
        return wrapEntity(101, "params has no '{' ");
    }
    let params = JSON.parse(data);
    if (params.debug){
        ROOT.BeFi.debug=params.debug;
    }
    for (const chainId in ROOT.BeFi.chains) {
        let chain = ROOT.BeFi.chains[chainId];
        chain.updateConfig(JSON.parse(JSON.stringify(params)));
    }
}
console.log('===>>>Core Bundle File Loaded!!!', new Date().toString())

module.exports = ROOT;
