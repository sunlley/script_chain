const sss = require('shamirs-secret-sharing');
const crypto = require('crypto')
const ALGORITHM = 'aes-256-cbc'; // 加密算法
const SHA256 = require("crypto-js/sha256");

// const md5 = require('md5')
// const salt = 'bbdfc33*sadfnjs997g-'
const salt = 'bbdfc98*sadfnjs997g-'
function hashPassword(password) {
    let result = SHA256(password+salt).toString();
    return result;
}

function strIsEmpty(str) {
    if (str===null){
        return true;
    }
    if (typeof str !=='string'){
        return false;
    }
    if (str===''){
        return true;
    }
    if (str.trim()===''){
        return true;
    }
    return false;
}

function createShards(keyString) {
    let dataBuf = Buffer.from(keyString, 'utf8');

    const shares = sss.split(dataBuf, {shares: 3, threshold: 2})
    const recovered = sss.combine(shares.slice(0, 2))
    const recovered2 = sss.combine(shares.slice(1, 3))
    if (recovered.toString() === keyString && keyString === recovered2.toString()) {// check一下能不能恢复
    } else {
        throw 'check error'
    }

    return shares
}

function encryptByPassword(source, password,wid){
    const iv = (hashPassword(wid)).substr(0,16);
    const key = (hashPassword(password).substr(0,32));
    let cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    // cipher.setAutoPadding(true)
    let encrypted = cipher.update(source, 'hex', 'hex');
    encrypted += cipher.final('hex')

    return encrypted;
}

function decryptByPassword(source, password,wid){
    const iv = (hashPassword(wid)).substr(0,16);
    password=hashPassword(password);
    password=password.substr(0,32);
    const key =password;
    let decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decShardString = decipher.update(source, 'hex', 'hex');
    decShardString += decipher.final('hex')
    return decShardString;
}

function encodeShard(params) {
    let {shards,password,wid}=params;
    let arr = createShards(shards);
    if (strIsEmpty(password)){
        return [
            arr[0].toString('hex'),
            arr[1].toString('hex'),
            arr[2].toString('hex'),
        ];
    }else{
        return [
            (encryptByPassword(arr[0].toString('hex'),password,wid)),
            (encryptByPassword(arr[1].toString('hex'),password,wid)),
            (encryptByPassword(arr[2].toString('hex'),password,wid)),
        ];
    }
}
function decodeShard(params) {
    let {shards,password,wid}=params;
    let arr = [];
    if (strIsEmpty(password)){
        arr=shards;
    }else{
        for (const item of shards) {
            arr.push((decryptByPassword(item,password,wid)))
        }
    }
    let shardsStr = sss.combine(arr);
    return shardsStr.toString();
}

module.exports = {
    encodeShard,
    decodeShard
};
