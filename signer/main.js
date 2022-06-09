const Crypto = require('./util/crypto')
const UrlEncode = require('urlencode');
const LUNA = require('./chain/terra');
const SOL = require('./chain/sol');
const TRX = require('./chain/trx');
const Group = require('./group/evm');

const ETH = new Group('ETH',1,'');
const BNB = new Group('BNB',56,'https://bsc-dataseed1.binance.org/');
const MAP = new Group('MAP',22776,'https://poc2-rpc.maplabs.io/');
const MATIC = new Group('MATIC',137,'');
const TRUE = new Group('TRUE',19330,'https://rpc.truescan.network/');
const AVAX = new Group('AVAX',43114,'https://api.avax.network/ext/bc/C/rpc/');
const KLAY = new Group('KLAY',8217,'https://klay-rpc.befiwalletdao.com/');
const FTM = new Group('FTM',250,'https://rpc.ankr.com/fantom/');
const CELO = new Group('CELO',42220,'https://forno.celo.org/');
const KCC = new Group('KCC',321,'https://rpc-mainnet.kcc.network/');

window.Bee={
    account:{},
    chain:{
        'LUNA':LUNA,
        'SOL':SOL,
        'TRX':TRX,
        'ETH':ETH,

        'BNB':BNB,
        'MAP':MAP,
        'MATIC':MATIC,
        'TRUE':TRUE,

        'AVAX':AVAX,
        'KLAY':KLAY,
        'FTM':FTM,
        'CELO':CELO,

        'KCC':KCC,
        '0x1':ETH
    },
    appid:"",
    appkey:"",
    license:"",
}
class CoinInject {

    constructor() {
        window.__jMessageCallbacks = {};
        window.__jHost = this.jHost;
        window.__jMessage = this.jMessage;
        this._ts = new Date().getTime();
        this._timer = setInterval(this.bind(this.refreshAccount, this), 100);
    }

    bind(fun) {
        var _this = arguments[1], args = [];
        for (var i = 2, il = arguments.length; i < il; i++) {
            args.push(arguments[i]);
        }
        return function () {
            var thisArgs = args.concat();
            for (var i = 0, il = arguments.length; i < il; i++) {
                thisArgs.push(arguments[i]);
            }
            return fun.apply(_this || this, thisArgs);
        }
    }

    refreshAccount() {

    }

    //params: cmd, chain, data
    jHost() {
        if (arguments.length < 1) {
            return;
        }

        var cmd = arguments[0];
        var id = new Date().getTime().toString();
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            if (arguments[i] instanceof Function) {
                window.__jMessageCallbacks[id] = arguments[i];
            } else {
                args.push(arguments[i]);
            }
        }
        var data;
        if (window.__JSHOST) {
            //(id, chain, data);
            data = [id].concat(args);
            window.__JSHOST[cmd].apply(this, data);
        } else if (window.webkit && window.webkit.messageHandlers) {
            //[cmd, id, chain, data]
            data = [cmd, id].concat(args);
            window.webkit.messageHandlers.__JSHOST.postMessage(JSON.stringify(data));
        } else {

        }
    }

    //params: id, err, reply
    jMessage() {
        if (arguments.length < 2) {
            return;
        }
        var id = arguments[0].toString();
        var args = [];
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }
        if (window.__jMessageCallbacks[id]) {
            window.__jMessageCallbacks[id].apply(this, args);
        }
    }
}

new CoinInject();

function jsCallback(id,data){

    if (window.__JSHOST) {
        window.__JSHOST.postMessage(JSON.stringify({
            method:"ScriptBack",
            id:id,
            data:data
        }));
    } else if (window.webkit && window.webkit.messageHandlers) {
        //[cmd, id, chain, data]
        data = ['scriptBack', id,data];
        window.webkit.messageHandlers.__JSHOST.postMessage(JSON.stringify(data));
    } else {

    }

}

function matchCore(coin) {
    coin = coin.toUpperCase();
    if(coin && window.Bee.chain[coin]){
        return window.Bee.chain[coin];
    }
    return null
}

function wrapEntity(code, msg, data = {}) {
    return {
        code: code,
        message: msg,
        data: data
    }
}

function matchLicense(){
    return true;
    try {
        var cry = new Crypto( window.Bee.appkey,window.Bee.appid);
        var license = UrlEncode.decode(window.Bee.license);
        var start = license.indexOf("Hex")+3;
        var end = license.indexOf('Expired');
        license=license.substr(start,end-start).trim().substr(2)
        var ts = cry.decrypt(license);
        ts = cry.licenseTS(ts);
        var now = new Date().getTime();
        //console.log(JSON.stringify({appid:window.Bee.appid,appkey:window.Bee.appkey,license:window.Bee.license,ts,now}))
        return now < ts;
    } catch (e) {
        console.error(e)
        return  false;
    }
}

function getMnemonic(data,core) {
    try {
        return wrapEntity(0, 'success', core.generateMnemonic());
    } catch (e) {
        console.log(e)
        return wrapEntity(110, 'getMnemonic failed ' + e.toString());
    }
}

async function getKeystore(data,core){
    if(!data['password']){
        return wrapEntity(101, 'No Params [getKeystore] [password]');
    }
    try {
        return wrapEntity(0, 'success',await core.getKeystore(data['privateKey'],data['password']));
    } catch (e) {
        return wrapEntity(110, 'getKeystore failed ' + e.toString());
    }
}

async function getAccount(data,core) {
    try {
        return wrapEntity(0, 'success', await core.generateAccount(data['privateKey'] || data['mnemonic']));
    } catch (e) {
        console.log(e)
        return wrapEntity(110, 'getAccount failed ' + e.toString());
    }
}

async function getPrivateKey(data,core) {

    if(!data['mnemonic'] && !data['keystore'] ){
        return wrapEntity(101, 'No Params [getPrivateKey] [mnemonic and keystore]');
    }
    try {
        if (data['mnemonic'] && data['mnemonic']!==''){
            var privateKey = await core.getPrivateKey(data['mnemonic'])
            return wrapEntity(0, 'success',privateKey);
        }else{
            if(!data['password']){
                return wrapEntity(101, 'No Params [getPrivateKey] [password]');
            }
            var keystore = UrlEncode.decode(data['keystore']);
            return wrapEntity(0, 'success', core.getPrivateKeyFromKeystore(keystore,data['password']));
        }

    } catch (e) {
        return wrapEntity(110, 'failed [getPrivateKey] ' + e.toString());
    }
}

function getPublicKey(data,core) {

    if(!data['privateKey'] && !data['mnemonic']){
        return wrapEntity(101, 'No Params [getPublicKey] [privateKey or mnemonic]');
    }

    try {
        return wrapEntity(0, 'success', core.getPublicKey(data['privateKey'] || data['mnemonic']));
    } catch (e) {
        return wrapEntity(110, 'failed  [getPublicKey] ' + e.toString());
    }
}

function getAddress(data,core) {
    if(!data['privateKey'] && !data['mnemonic']){
        return wrapEntity(101, 'No Params [getAddress] [privateKey or mnemonic]');
    }
    try {
        return wrapEntity(0, 'success', core.getAddress(data['privateKey'] || data['mnemonic']));
    } catch (e) {
        return wrapEntity(110, 'failed [getAddress] '+e.toString());
    }
}

function validateAddress(data,core) {

    if(!data['address']){
        return wrapEntity(101, 'No Params [validateAddress] [address]');
    }

    try {
        return wrapEntity(0, 'success', core.validateAddress(data['address']).toString());
    } catch (e) {
        return wrapEntity(110, 'failed [validateAddress]'+e.toString());
    }
}

function validatePrivateKey(data,core) {
    if(!data['privateKey']){
        return wrapEntity(101, 'No Params [validatePrivateKey] [privateKey]');
    }
    try {
        return wrapEntity(0, 'success', core.validatePrivateKey(data['privateKey']).toString());
    } catch (e) {
        return wrapEntity(110, 'failed [validatePrivateKey] '+e.toString());
    }
}

function validateMnemonic(data,core) {
    if(!data['mnemonic']){
        return wrapEntity(101, 'No Params [validateMnemonic] [mnemonic]');
    }

    try {
        return wrapEntity(0, 'success', core.validateMnemonic(data['mnemonic']).toString());
    } catch (e) {
        return wrapEntity(110, 'failed [validateMnemonic] '+e.toString());
    }
}

async function signMessage(data,core) {

    if(!data['privateKey'] && !data['mnemonic']){
        return wrapEntity(101, 'No Params [signMessage] [privateKey and mnemonic]');
    }
    if(!data['message']){
        return wrapEntity(101, 'No Params [signMessage] [message]');
    }
    try {
        var privateKey = data['privateKey'];
        if (!privateKey){
            var mnemonic = data['mnemonic'];
            if(!mnemonic){
                return wrapEntity(101, 'No Params [signMessage] [mnemonic]');
            }
            privateKey = await core.getPrivateKey(mnemonic);
            data['privateKey'] = privateKey;
        }
        return wrapEntity(0, 'success', await core.signMessage(data['privateKey'], data['message']));
    } catch (e) {
        return wrapEntity(110, 'failed [signMessage] '+e.toString());
    }
}

async function signTransaction(data,core) {
    //console.log('=> signTransaction',JSON.stringify(data))
    if(!data['privateKey'] && !data['mnemonic']){
        return wrapEntity(101, 'No Params [signTransaction] [privateKey and mnemonic]');
    }
    try {
        var result = await core.signTransaction(data['privateKey']!=null?data['privateKey']:data['mnemonic'],data);
        return wrapEntity(0, 'success', result);
    } catch (e) {
        return wrapEntity(110, 'failed [signTransaction]' + e.toString());
    }
}

function formatDapp(data,core) {

    if(!data['data']){
        return wrapEntity(101, 'No Params [formatDapp] [data]');
    }

    try {
        return wrapEntity(0, 'success', core.formatDapp(data['data']));
    } catch (e) {
        return wrapEntity(110, 'failed [formatDapp] ' + e.toString());
    }
}

/*
 * 100  not support
 * 110  option err
 * 101  params err
 * 105  license AUTH err
 */
window.CallChain=async function (data){
    console.log('CallChain',JSON.parse(data));

    if (!matchLicense()){
        return wrapEntity(101, `License expired ${data}`);
    }
    if (typeof data === 'object'){
        data = JSON.stringify(data);
    }
    console.log('JS Core Window CallChain',data)
    if(!data && !data.startsWith('{')){
        return wrapEntity(101, "params has no '{' ");
    }
    try {
        data = JSON.parse(data);
    } catch (e) {
        console.log(`== Chain Core CallChain [JSON 解析失败]  ${data}`+e,data);
    }
    if(!data['contract'] && !data['chainId'] ){
        return wrapEntity(101, 'no Contract or ChainId');
    }
    if(!data['method']){
        return wrapEntity(101, 'no method ');
    }
    var method =data['method'];
    console.log(`== Chain Core CallChain [${method}] == `+JSON.stringify(data));
    var core = matchCore(data['contract']);
    if(!core){
        core = matchCore(data['chainId']);
    }
    if(!core){
        return wrapEntity(101, 'not support this contract:'+data['contract']);
    }
    var jsid = data['jsid'];
    var result=null;
    if (method === 'getMnemonic'){
        result= getMnemonic(data,core);
    }else if (method === 'getPrivateKey'){
        result= await getPrivateKey(data,core);
    }else if (method === 'getPublicKey'){
        result= getPublicKey(data,core);
    }else if (method === 'getAddress'){
        result= getAddress(data,core);
    }else if (method === 'validateAddress'){
        result= validateAddress(data,core);
    }else if (method === 'validatePrivateKey'){
        result= validatePrivateKey(data,core);
    }else if (method === 'validateMnemonic'){
        result= validateMnemonic(data,core);
    }else if (method === 'formatDapp'){
        result= formatDapp(data,core);
    }else if (method === 'signMessage'){
        result= await signMessage(data,core);
    }else if (method === 'signTransaction'){
        result= await signTransaction(data,core);
    }else if (method === 'getKeystore'){
        result= await getKeystore(data,core);
    }else if (method === 'getAccount'){
        result= await getAccount(data,core);
    }else {
        result= wrapEntity(100, 'not support this method:'+method);
    }
    jsCallback(jsid,result);
}

//非标准化的方法，统一函数入口
window.callMethod = function(data){
    console.log("==== chain core callMethod===");
    if (typeof data === 'object'){
        data = JSON.stringify(data);
    }
    if(!data && !data.startsWith('{')){
        return wrapEntity(101, "params has no '{' ");
    }
    var params = JSON.parse(data);
    if(!data['contract'] && !data['chainId'] ){
        return wrapEntity(101, 'no Contract or ChainId');
    }
    if(!params['method']){
        return wrapEntity(101, 'No Params [callMethod] [contract or method]');
    }
    var core = matchCore(params['contract']);
    if(!core){
        core = matchCore(data['chainId']);
    }
    if(!core){
        return wrapEntity(101, 'not support this contract:'+data['contract']);
    }
    if(!core[params['method']]){
        return wrapEntity(100, '没有此方法');
    }
    try {
        return wrapEntity(0, 'success', core[params['method']](params));
    } catch (e) {
        return wrapEntity(110, 'failed ' + e.toString());
    }
}

window.initCore=function (data){
    //console.log('===>>> initCore '+data)
    if (typeof data === 'object'){
        data = JSON.stringify(data);
    }
    if(!data && !data.startsWith('{')){
        return wrapEntity(101, "params has no '{' ");
    }
    var params = JSON.parse(data);
    window.Bee.license = params['license'];
    window.Bee.appkey = params['appkey'];
    window.Bee.appid = params['appid'];
}
console.log('===>>>Core Bundle File Loaded!!!',new Date().toString())
