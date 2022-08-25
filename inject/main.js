const Core = require('./libs/core2')

var ROOT = null;
try {
    ROOT = window;
} catch (e) {
}
if (!ROOT) {
    ROOT = {};
}

ROOT.BeFi = {
    'session': {'url': 'https://pancakeswap.finance/', 'chainId': '0x38'},
    'account': {'0x38': {'address': '0x03F5E6eC887f89fB8673BF9266E1d2a0e24EDB48'}},
    'chain': {
        '0x38': {'rpcURL': 'https://bsc-dataseed1.defibit.io', 'chainId': '0x38'},
        '0x1': {'rpcURL': 'https://bsc-dataseed1.defibit.io', 'chainId': '0x1'}
    },
    'appid': 'm8z8o7idsf3uebn',
    'appkey': 'aaoyf98*sadfnjsad7g-',
    'license': '',
    'version': '1.4.0'
}


ROOT.__jHost = function () {
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
ROOT.__jMessage = function () {
    console.log("__jMessage ===>",arguments)
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
ROOT.__jMessageCallbacks = {};

ROOT.setAccount = function (account) {
    if (typeof account === 'string') {
        account = JSON.parse(account);
    }
    ROOT.BeFi = account;
}

class BridgeInject {

    constructor(target) {
        this.target = target;
        this._waitingAccounts = false;
        this._ts = new Date().getTime();
        this._timer = setInterval(this.bind(this.refreshAccount, this), 500);
        this.refreshAccount();
    }

    bind(fuck) {
        var _this = arguments[1], args = [];
        for (var i = 2, il = arguments.length; i < il; i++) {
            args.push(arguments[i]);
        }
        return function () {
            var thisArgs = args.concat();
            for (var i = 0, il = arguments.length; i < il; i++) {
                thisArgs.push(arguments[i]);
            }
            return fuck.apply(_this || this, thisArgs);
        }
    }

    refreshAccount() {
        var _that = this;
        if (this.target.BeFi
            && this.target.BeFi.session
            && this.target.BeFi.account){
            clearInterval(this._timer);
            let session = this.target.BeFi.session;
            let account = this.target.BeFi.account;
            let chain = this.target.BeFi.chain;
            let chainId = session.chainId;
            console.log("Inject","Type 0",chainId,account,chain)
            this.initAccount(account[chainId],chain[chainId] );

        }else if (new Date().getTime() - this._ts > 25000) {
            clearInterval(this._timer);
        } else {
            if (!this._waitingAccounts) {
                this._waitingAccounts = true;
                clearInterval(this._timer);
                // window.__jHost('injectAccount', '', {}, function (err, reply) {
                //     _that._waitingAccounts = false;
                //     console.log("injectAccount success", reply)
                //     if (err) {
                //     } else {
                //         var result = reply;
                //         if (typeof result == 'string') {
                //             result = JSON.parse(reply);
                //         }
                //         window.Bee.account = result;
                //         clearInterval(this._timer);
                //         _that.refreshAccount();
                //     }
                // });
            }
        }

    }

    initAccount(account, chain) {
        if (this.core) {
            console.log("Inject","Type 1",account,chain)
            this.core.reset(account, chain);

        } else {
            console.log("Inject","Type 2",account,chain)
            this.core = new Core(this.target,account, chain);
        }

    }
}

const inject = new BridgeInject(ROOT);


module.exports = ROOT;







