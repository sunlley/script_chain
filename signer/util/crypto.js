const CryptoJS = require('crypto-js');  //引用AES源码js
const SHA256 = require("crypto-js/sha256");



class Crypto{

    constructor(key,iv) {
        this.a=[10,15,17,19,24,26,40,43,48,78,91,110,114];
        this.k  = CryptoJS.enc.Utf8.parse(key);  //十六位十六进制数作为密钥
        this.i = CryptoJS.enc.Utf8.parse(iv);   //十六位十六进制数作为密钥偏移量
    }

    randomTS(length,timestamp) {
        let e = '';
        timestamp=`${timestamp}`;
        let keyLostIndex=0;
        for (let n = ',./!@#$%^&*()_+=-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890', o = 0;
             o < length; o++) {
            if (this.a[keyLostIndex] === o){
                e+=timestamp[keyLostIndex];
                keyLostIndex++;
            }else {
                e += n.charAt(Math.floor(Math.random() * n.length));
            }
        }
        return e;
    }

    //加密方法
    encrypt(word) {
        let srcs = CryptoJS.enc.Utf8.parse(word);
        let encrypted = CryptoJS.AES.encrypt(srcs, this.k, { iv: this.i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return encrypted.ciphertext.toString().toUpperCase();
    }

    //解密方法
    decrypt(word) {
        let encryptedHexStr = CryptoJS.enc.Hex.parse(word);
        let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        let decrypt = CryptoJS.AES.decrypt(srcs, this.k, { iv: this.i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();
    }

    licenseTS(word){
        let tsStr='';
        let keyLostIndex=0;
        for (let i = 0; i < word.length; i++) {
            let element = word[i];
            if (i == this.a[keyLostIndex]){
                tsStr+=element;
                keyLostIndex++;
            }
        }
        return parseInt(tsStr);
    }

    sha256(data){
        return SHA256(data).toString();

    }

}
module.exports=Crypto;
