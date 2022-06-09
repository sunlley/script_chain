
window.Bee = {
    'session':{'url':'','chain':''},
    'account': {'bnb': {'address': '0x03F5E6eC887f89fB8673BF9266E1d2a0e24EDB48'}},
    'chain': {'bnb': {'rpcURL': 'https://bsc-dataseed1.defibit.io', 'chainId': '56'}},
    'appid': 'm8z8o7idsf3uebn',
        'appkey': 'aaoyf98*sadfnjsad7g-',
        'license': '',
        'version': '1.4.0'
}
window.__jHost = function () {
    if (arguments.length < 1) {
        console.log("Call jHost failed ,params error")
        return;
    }
    let cmd = arguments[0];

    let id = new Date().getTime().toString();
    console.log("Call jHost:" + cmd)
    if (arguments.length === 4) {
        window.__jMessageCallbacks[id] = arguments[3];
    }

    if (window.__JSHOST) {
        //(id, chain, data);
        let chain = arguments[1];
        let data = {};
        if (arguments.length > 2) {
            data = arguments[2];
            if (typeof data == 'string') {
                data = JSON.parse(data);
            }
        }
        let params = {
            id: id,
            method: cmd,
            chain: chain,
            data: data
        }
        params = JSON.stringify(params);
        window.__JSHOST.postMessage(params);
    } else if (window.webkit && window.webkit.messageHandlers) {
        let args = [];
        for (let i = 1; i < arguments.length; i++) {
            if (arguments[i] instanceof Function) {
                window.__jMessageCallbacks[id] = arguments[i];
            } else {
                args.push(arguments[i]);
            }
        }
        //[cmd, id, chain, data]
        let data = [cmd, id].concat(args);
        window.webkit.messageHandlers.__JSHOST.postMessage(JSON.stringify(data));
    } else {

    }
};
window.__jMessage = function () {
    if (arguments.length < 2) {
        return;
    }
    let id = arguments[0].toString();
    let args = [];
    if (arguments.length > 1) {
        for (let i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
    }
    if (window.__jMessageCallbacks[id]) {
        window.__jMessageCallbacks[id].apply(this, args);
    }
};
window.__jMessageCallbacks = {};
window.setAccount = function (account) {
    if (typeof account === 'string') {
        account = JSON.parse(account);
    }
    window.Bee = account;
}







