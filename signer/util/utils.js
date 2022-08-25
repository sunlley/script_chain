const crypto = require("crypto");
const md5 = require('md5');
function randomString(length) {
    let e = '';
    for (let n = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890', o = 0;
         o < length; o++) {
        e += n.charAt(Math.floor(Math.random() * n.length));
    }
    return e;
}
function netSign(params,nonce,offset){
    // console.log('NetSign',0,'==>>',typeof params,params)
    if (typeof params ==='string'){
        params=JSON.parse(params);
    }
    let tempList=[];
    for (let paramsKey in params) {
        tempList.push(`${paramsKey}=${params[paramsKey]}`);
    }
    tempList.push(`nonce=${nonce}`);
    tempList.sort();
    let tempString = '';
    for (let tempListElement of tempList) {
        tempString +=`${tempListElement}&`;
    }
    // console.log('NetSign',1,'==>>',tempString)
    tempString = tempString+offset;
    // console.log('NetSign',2,'==>>',tempString)
    tempString = md5(tempString);
    // console.log('NetSign',3,'==>>',tempString)
    tempString = `${tempString}/nonce=${nonce}`;
    // console.log('NetSign',4,'==>>',tempString)
    tempString = crypto.createHash('sha1').update(tempString).digest('hex');
    // console.log('NetSign',5,'==>>',tempString)
    return tempString;
}
module.exports={randomString,netSign};
