require('./inject')
const Core = require('./libs/core2')

class BridgeInject {

    constructor() {
        this._waitingAccounts = false;
        this._ts = new Date().getTime();
        this._timer = setInterval(this.bind(this.refreshAccount, this), 500);
        this.refreshAccount();
        // window.JHOST_INJECT=this;
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
        /*
        {
            'session':{'url':'','chain':'','icon':''},
            'account': {'bnb': {'address': '0x03F5E6eC887f89fB8673BF9266E1d2a0e24EDB48'}},
            'chain': {'bnb': {'rpcURL': 'https://bsc-dataseed1.defibit.io', 'chainId': '56'}},
            'defaultChain':'bnb',
            'appid': 'm8z8o7idsf3uebn',
            'appkey': 'aaoyf98*sadfnjsad7g-',
            'license': '',
            'version': '1.4.0'
        }
         */
        let account = window.Bee ? window.Bee.account : null;
        if (account!==null) {
            clearInterval(this._timer);
            let chain=null;
            if (window.Bee.defaultChain){
                chain=window.Bee.defaultChain;
            }else{
                let keys = Object.keys(account);
                if (keys.length>0){
                    chain=keys[0];
                }
            }
            if (chain==null){
                this.refreshAccount();
                return
            }
            account = account[chain];
            if (account) {
                this.initAccount(account, window.Bee.chain[chain]);
            }
        } else if (new Date().getTime() - this._ts > 25000) {
            clearInterval(this._timer);
        } else {
            if (!this._waitingAccounts) {
                this._waitingAccounts = true;
                window.__jHost('injectAccount', '', {}, function (err, reply) {
                    _that._waitingAccounts = false;
                    console.log("injectAccount success", reply)
                    if (err) {
                    } else {
                        var result = reply;
                        if (typeof result == 'string') {
                            result = JSON.parse(reply);
                        }
                        window.Bee.account = result;
                        clearInterval(this._timer);
                        _that.refreshAccount();
                    }
                });
            }
        }
    }

    /*
    window.Bee = {
    'session':{'url':'','chain':'bnb'},
    'account': {'bnb': {'address': '0x03F5E6eC887f89fB8673BF9266E1d2a0e24EDB48'}},
    'chain': {'bnb': {'rpcURL': 'https://bsc-dataseed1.defibit.io', 'chainId': '56'}},
    'appid': '',
    'appkey': '',
    'license': '',
    'version': '1.4.0'
}
     */
    initAccount(account, chain) {
        if (this.core){
            this.core.reset(account,chain);
            console.log("Inject Success Type 1")

        }else{
            this.core = new Core(account,chain);
            console.log("Inject Success Type 2")

        }

    }
}
new BridgeInject();
