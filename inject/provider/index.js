const {EventEmitter} = require('events');
const {Buffer} = require("buffer");
const Decimal = require('decimal.js');
const isUtf8 =require('isutf8');
const{ TypedDataUtils, SignTypedDataVersion }=require('@metamask/eth-sig-util')

class Utils {
    static genId() {
        return new Date().getTime() + Math.floor(Math.random() * 1000);
    }

    static flatMap(array, func) {
        return [].concat(...array.map(func));
    }

    static intRange(from, to) {
        if (from >= to) {
            return [];
        }
        return new Array(to - from).fill().map((_, i) => i + from);
    }

    static hexToInt(hexString) {
        if (hexString === undefined || hexString === null) {
            return hexString;
        }
        return Number.parseInt(hexString, 16);
    }

    static intToHex(int) {
        if (int === undefined || int === null) {
            return int;
        }
        let hexString = int.toString(16);
        return "0x" + hexString;
    }

    // message: Bytes | string
    static messageToBuffer(message) {
        var buffer = Buffer.from([]);
        try {
            if ((typeof (message) === "string")) {
                buffer = Buffer.from(message.replace("0x", ""), "hex");
            } else {
                buffer = Buffer.from(message);
            }
        } catch (err) {
            console.log(`messageToBuffer error: ${err}`);
        }
        return buffer;
    }

    static bufferToHex(buf) {
        return "0x" + Buffer.from(buf).toString("hex");
    }
}
class IdMapping {
    constructor() {
        this.intIds = new Map;
    }

    tryIntifyId(payload) {
        if (!payload.id) {
            payload.id = Utils.genId();
            return;
        }
        if (typeof payload.id !== "number") {
            let newId = Utils.genId();
            this.intIds.set(newId, payload.id);
            payload.id = newId;
        }
    }

    tryRestoreId(payload) {
        let id = this.tryPopId(payload.id);
        if (id) {
            payload.id = id;
        }
    }

    tryPopId(id) {
        let originId = this.intIds.get(id);
        if (originId) {
            this.intIds.delete(id);
        }
        return originId;
    }
}
class RPCServer {
    constructor(rpcUrl) {
        this.rpcUrl = rpcUrl;
    }

    getBlockNumber() {
        return this.call({jsonrpc: "2.0", method: "eth_blockNumber", params: []})
            .then(json => json.result);
    }

    getBlockByNumber(number) {
        return this.call({jsonrpc: "2.0", method: "eth_getBlockByNumber", params: [number, false]})
            .then(json => json.result);
    }

    getFilterLogs(filter) {
        return this.call({jsonrpc: "2.0", method: "eth_getLogs", params: [filter]});
    }

    call(payload) {
        return fetch(this.rpcUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(json => {
                if (!json.result && json.error) {
                    console.log("<== rpc error", json.error);
                    throw new Error(json.error.message || "rpc error");
                }
                return json;
            });
    }
}
class RpcError extends Error {
    constructor(code, message) {
        super();
        this.code = code;
        this.message = message;
    }

    toString() {
        return `${this.message} (${this.code})`;
    }
}




class Provider extends EventEmitter{
    /*
        listeners
            connect
            chainChanged
            networkChanged
        config
            chainId
            rpcUrl
            isDebug
            address
     */
    constructor(target,config) {
        super();
        this.target = target;
        config.chainId = new Decimal(config.chainId).toHex();
        this.idMapping = new IdMapping();
        this.callbacks=new Map();
        this.wrapResults = new Map();

        this.isBeFi=true;
        this.isMetaMask=true;
        this.isDebug = !!config.isDebug;
        this.setConfig(config);
        this.emitConnect(config.chainId);
    }

    setConfig(config) {
        this.setAddress(config.address);
        this.setChain(config);
        this.isDebug = !!config.isDebug;
    }
    setChain(config){
        this.networkVersion = "" + config.chainId;
        this.chainId = new Decimal(config.chainId).toHex();
        this.netVersion = new Decimal(config.chainId).toNumber();
        this.networkVersion = new Decimal(config.chainId).toNumber();
        this.rpc = new RPCServer(config.rpcUrl);
    }

    setAddress(address) {
        const lowerAddress = (address || "").toLowerCase();
        this.address = lowerAddress;
        this.selectedAddress =this.address;
        this.account =this.address;
        this.accounts =[this.address];
        this.ready = !!address;
        try {
            if (this.target && this.target.frames) {
                for (let i = 0; i < this.target.frames.length; i++) {
                    const frame = this.target.frames[i];
                    if (frame.ethereum && frame.ethereum.isBeFi) {
                        frame.ethereum.address = lowerAddress;
                        frame.ethereum.ready = !!address;
                    }
                }
            }
        } catch (e) {
        }
    }

    emitConnect(chainId) {
        this.emit("connect", { chainId: chainId });
    }

    emitChainChanged(chainId) {
        this.emit("chainChanged", chainId);
        this.emit("networkChanged", chainId);
    }


    isConnected() {
        return true;
    }
    enable() {
        console.log('enable() is deprecated, please use window.ethereum.request({method: "eth_requestAccounts"}) instead.');
        return this.request({ method: "eth_requestAccounts", params: [] });
    }

    sendResponse(id, result) {
        let originId = this.idMapping.tryPopId(id) || id;
        let callback = this.callbacks.get(id);
        let wrapResult = this.wrapResults.get(id);
        let data = { jsonrpc: "2.0", id: originId };
        if (
            result !== null &&
            typeof result === "object" &&
            result.jsonrpc &&
            result.result
        ) {
            data.result = result.result;
        } else {
            data.result = result;
        }
        if (this.isDebug) {
            console.log(
                `<== sendResponse id: ${id}, result: ${JSON.stringify(
                    result
                )}, data: ${JSON.stringify(data)}`
            );
        }

        if (callback) {
            wrapResult ? callback(null, data) : callback(null, result);
            this.callbacks.delete(id);
        } else {
            console.log(`callback id: ${id} not found`);
            // check if it's iframe callback
            for (let i = 0; i < this.target.frames.length; i++) {
                const frame = this.target.frames[i];
                try {
                    if (frame.ethereum.callbacks.has(id)) {
                        frame.ethereum.sendResponse(id, result);
                    }
                } catch (error) {
                    console.log(`send response to frame error: ${error}`);
                }
            }
        }
    }

    sendError(id, error) {
        console.log(`<== ${id} sendError ${error}`);
        let callback = this.callbacks.get(id);
        if (callback) {
            callback(error instanceof Error ? error : new Error(error), null);
            this.callbacks.delete(id);
        }
    }

    postMessage(handler, id, data) {
        if (this.ready || handler === "requestAccounts") {
            let object = {
                id: id,
                name: handler,
                object: data,
            };
            try {
                if (this.target.trustwallet.postMessage) {
                    this.target.trustwallet.postMessage(object);
                } else {
                    // old clients
                    this.target.webkit.messageHandlers[handler].postMessage(object);
                }
            } catch (e) {
            }
        } else {
            // don't forget to verify in the app
            this.sendError(id, new RpcError(4100, "provider is not ready"));
        }
    }

    send(payload) {
        if (this.isDebug) {
            console.log(`==> send payload ${JSON.stringify(payload)}`);
        }
        let response = { jsonrpc: "2.0", id: payload.id };
        switch (payload.method) {
            case "eth_accounts":
                response.result = this.eth_accounts();
                break;
            case "eth_coinbase":
                response.result = this.eth_coinbase();
                break;
            case "net_version":
                response.result = this.net_version();
                break;
            case "eth_chainId":
                response.result = this.eth_chainId();
                break;
            default:
                throw new RpcError(
                    4200,
                    `Trust does not support calling ${payload.method} synchronously without a callback. Please provide a callback parameter to call ${payload.method} asynchronously.`
                );
        }
        return response;
    }

    request(payload) {
        if (this.isDebug) {
            console.log(`==> request payload ${JSON.stringify(payload)}`);
        }
        return this._request(payload, false);
    }

    _request(payload, wrapResult = true) {
        this.idMapping.tryIntifyId(payload);
        if (this.isDebug) {
            console.log(`==> ____request payload ${JSON.stringify(payload)}`);
        }
        if (payload && payload.jsonrpc === undefined) {
            payload.jsonrpc = "2.0";
        }
        return new Promise((resolve, reject) => {
            if (!payload.id) {
                payload.id = Utils.genId();
            }
            this.callbacks.set(payload.id, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
            this.wrapResults.set(payload.id, wrapResult);
            switch (payload.method) {
                case "eth_accounts":
                    return this.sendResponse(payload.id, this.eth_accounts());
                case "eth_requestAccounts":
                    return this.eth_requestAccounts(payload);
                case "eth_coinbase":
                    return this.sendResponse(payload.id, this.eth_coinbase());
                case "net_version":
                    return this.sendResponse(payload.id, this.net_version());
                case "eth_chainId":
                    return this.sendResponse(payload.id, this.eth_chainId());
                case "eth_sign":
                    return this.eth_sign(payload);
                case "personal_sign":
                    return this.personal_sign(payload);
                case "personal_ecRecover":
                    return this.personal_ecRecover(payload);
                case "eth_signTypedData_v3":
                    return this.eth_signTypedData(payload, SignTypedDataVersion.V3);
                case "eth_signTypedData":
                case "eth_signTypedData_v4":
                    return this.eth_signTypedData(payload, SignTypedDataVersion.V4);
                case "eth_sendTransaction":
                    return this.eth_sendTransaction(payload);

                case "wallet_watchAsset":
                    return this.wallet_watchAsset(payload);
                case "wallet_addEthereumChain":
                    return this.wallet_addEthereumChain(payload);
                case "wallet_switchEthereumChain":
                    return this.wallet_switchEthereumChain(payload);
                case "eth_newFilter":
                case "eth_newBlockFilter":
                case "eth_newPendingTransactionFilter":
                case "eth_uninstallFilter":
                case "eth_subscribe":
                    throw new ProviderRpcError(
                        4200,
                        `Trust does not support calling ${payload.method}. Please use your own solution`
                    );
                default:
                    // call upstream rpc
                    this.callbacks.delete(payload.id);
                    this.wrapResults.delete(payload.id);
                    return this.rpc
                        .call(payload)
                        .then((response) => {
                            if (this.isDebug) {
                                console.log(`<== rpc response ${JSON.stringify(response)}`);
                            }
                            wrapResult ? resolve(response) : resolve(response.result);
                        })
                        .catch(reject);
            }
        });
    }

    eth_accounts() {
        return this.address ? [this.address] : [];
    }
    eth_coinbase() {
        return this.address;
    }

    net_version() {
        return this.networkVersion;
    }

    eth_chainId() {
        return this.chainId;
    }
    eth_requestAccounts(payload) {
        this.postMessage("requestAccounts", payload.id, {});
    }

    eth_sign(payload) {
        const buffer = Utils.messageToBuffer(payload.params[1]);
        const hex = Utils.bufferToHex(buffer);
        if (isUtf8(buffer)) {
            this.postMessage("signPersonalMessage", payload.id, { data: hex });
        } else {
            this.postMessage("signMessage", payload.id, { data: hex });
        }
    }

    personal_sign(payload) {
        const message = payload.params[0];
        const buffer = Utils.messageToBuffer(message);
        if (buffer.length === 0) {
            // hex it
            const hex = Utils.bufferToHex(message);
            this.postMessage("signPersonalMessage", payload.id, { data: hex });
        } else {
            this.postMessage("signPersonalMessage", payload.id, { data: message });
        }
    }

    personal_ecRecover(payload) {
        this.postMessage("ecRecover", payload.id, {
            signature: payload.params[1],
            message: payload.params[0],
        });
    }

    eth_signTypedData(payload, version) {
        const message = JSON.parse(payload.params[1]);
        const hash = TypedDataUtils.eip712Hash(message, version);
        this.postMessage("signTypedMessage", payload.id, {
            data: "0x" + hash.toString("hex"),
            raw: payload.params[1],
        });
    }

    eth_sendTransaction(payload) {
        this.postMessage("signTransaction", payload.id, payload.params[0]);
    }

    wallet_addEthereumChain(payload) {
        this.postMessage("addEthereumChain", payload.id, payload.params[0]);
    }

    wallet_switchEthereumChain(payload) {
        this.postMessage("switchEthereumChain", payload.id, payload.params);
    }


}

module.exports=Provider;
