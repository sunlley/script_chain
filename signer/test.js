const Singer = require('./main')
Singer.init({
    appkey: "231fff545322962d9278c19de7f80180",
    appid: "97a183f8e0fd9f0629d30ceea2105dc0",
    // server: "http://18.141.178.177:9007",s
    server: "http://127.0.0.1:9007",
    chains: {
        "0x38": {
            chainId: "0x38",
            chainName:"BinanceSmartChain",
            decimals:18,
            contract:"BNB"
        }
    },
    debug:false
})
Singer.__JSHOST = {
    postMessage: (data) => {
        console.log('PostMessage', data)
    }
}

async function test_init() {

}

async function getMnemonic() {
    // Singer.request({
    //     jsid:'123',
    //     method:"encodeMessage",
    //     message:"testpassword"
    // })
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getMnemonic",
    })
}

async function getAddress() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getAddress",
        privateKey: "0x332639ccdaa55c66a0f04bcdf44196cc6f0c21bcdc745706ddefca4dde6099ef"
    })
}

async function validateAddress() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "validateAddress",
        address: "0x8222AA5779Fc4e2De85177AefB2534E8c28ADFDE"
    })
}

async function getPrivateKey() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getPrivateKey",
        mnemonic: "street pull adapt burger reduce dish index staff shadow surge bird jaguar"
    })
}

async function signMessage() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "signMessage",
        privateKey: "0x332639ccdaa55c66a0f04bcdf44196cc6f0c21bcdc745706ddefca4dde6099ef",
        message: {data: "abctest"}
    })
}

async function getAccount() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getAccount",
    })
}

async function test_encodeMessage() {
    // Singer.request({
    //     jsid:'123',
    //     method:"encodeMessage",
    //     message:"testpassword"
    // })
    Singer.request({
        jsid: '123',
        method: "decodeMessage",
        message: "DCC98B11BA7466D03397E48DBFDBB3E7"
    })


}

async function test_nonce() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getNonce",
        address: '0x766f3377497C66c31a5692A435cF3E72Dcc2d4Fc'
    })
}

async function test_balance() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getBalance",
        address: '0x766f3377497C66c31a5692A435cF3E72Dcc2d4Fc'
    })
}

async function test_decimals() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getDecimals",
        contractAddress: '0x55d398326f99059ff775485246999027b3197955'
    })
}

async function test_gasPrice() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getGasPrice"
    })
}

async function test_getReceipt() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getReceipt",
        hash: '0x474207c61a31bf208f0f7d1a882cd82a12421e253250904cdc1470419078a5be'
    })
}

async function test_getFee() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "getFee",
        "from": "0xAeA144E143D90f8B8ebF5153e73813f2FCf3321E",
        "to": "0x766f3377497C66c31a5692A435cF3E72Dcc2d4Fc",
        "value": "1",
        "decimals": 18,
    })
}

async function test_encodeERC20ABI() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "encodeERC20ABI",
        contractAddress: '0x55d398326f99059ff775485246999027b3197955',
        contractMethod: 'transfer',
        params: ['0x766f3377497C66c31a5692A435cF3E72Dcc2d4Fc', '0x1'],
    })
}

async function encodeShard() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "encodeShard",
        shards: 'physical power angle race protect hen satoshi pilot horse snake jaguar flee',
        wid: '0xohiunfsadlkhf',
        password: 'asdoihfosdnbkljbnkjlsdf',
    })
}

async function decodeShard() {
    Singer.request({
        jsid: '123',
        chainId: '0x38',
        method: "decodeShard",
        wid: '0xohiunfsadlkhf',
        password: 'asdoihfosdnbkljbnkjlsdf',
        shards: ["c724039b55e2f01b47070c1efad430b2e99c4bc994c7a8a1223a500453ef04c72fff371165f2333c42e2053281bb527b9ae63d80632fea7d77a7cc9bc6c97c00341d465003694c49e947e201fc316d77d881220d1e72c2288bc13c773619173dcd4500bee6cd113d494d45659c1e5a17953e15cc1e3c51e4cb33deadaf22c35612e06413061204dde0d78cf2a25a9eb4a938e8a8b751c75cb6b7a3efbca4b5ae99d6134b7a07147689de0bf02c908c99", "66bf5bd10c20a6921f776641e3d3331c2b25f4bcbb3e387492b436c260960c8b0c7154fdfb0758a4c279bdd6c94b87717fed287964fc26f16fd4df9fcb64fd869ebcade49fc33e793a93399f0796a203e0a9fbd6091c688199e3b163b99661837837ea8bb464bf2cdd8524a6e0af3e8264b172a306d5dae0710b167c2e3dbfe3766ed71caf1141a730eaecdce7e2895fd36c3c56538505e2f5b660e1c1e30bc458cd44e05cb6a3ec9a7cc775a45c436b"]

    })
}

async function encodeAuth() {
    Singer.request({
        jsid: '123',
        method: "encodeAuth",
        message: 'asdoihfosdnbkljbnkjlsdf',
        uuid: "asdoihfosdnbkljbnkjlsdf"

    })
}

async function decodeAuth() {
    Singer.request({
        jsid: '123',
        method: "decodeAuth",
        message: 'A77D8E7DB419453C3CA241D1F2592D586525333AA730C60FC61F4F5AD91408A4',
        uuid: "asdoihfosdnbkljbnkjlsdf"

    })
}

async function encodeMessage() {
    Singer.request({
        jsid: '123',
        method: "encodeMessage",
        password: 'A77D8E7DB419453C3CA241D1F2592D586525333AA730C60FC61F4F5AD91408A4',
        message: "encodeMessageTest"
    })
}

async function decodeMessage() {
    Singer.request({
        jsid: '123',
        method: "decodeMessage",
        password: "A77D8E7DB419453C3CA241D1F2592D586525333AA730C60FC61F4F5AD91408A4",
        message: 'U2FsdGVkX1/JHpWaBQVhzUYCk3wrAtlkS7tI9QtdDID5Rg3xMNOvkxxhy1T0vqMN',


    })
}

async function test_signTransaction() {
    Singer.request({
        jsid: '123',
        method: "signTransaction",
        chainId: 0x58f8,
        privateKey: 0x3b699946d7a6dcecc9b96d5382571944f3ca416cef90c10af35903f4c23633cb,
        to: 0xCf859C66a066a94B2A99cF787A7beFB31146A118,
        value: 0.12,
        decimals: 18,
        gasPrice: 313031303030303030303030,
        gasLimit: 21000,
        nonce: 57


    })
}

async function test_toHex() {
    Singer.request({
        jsid: '123',
        method: "toHex",
        value: 1,
    })
}

async function test_encodeShard() {
    Singer.request({
        jsid: '123',
        wid: "0xijfg9uasd97gsdf",
        method: "encodeShard",
        password: "123123",
        shards: 'prefer one permit report december super mandate organ shoot laptop harbor crop',
    })
}

async function test_decodeShard() {
    Singer.request({
        jsid: '123',
        method:"decodeShard",
        shards: [
            "cf9e8ae65ac517676d69ac9dfa8bc8bb7b41cb272a4e892c169264dc29374b5add3db92a55fee00138a0bc6350a622518603bb1c1e4afff4d2aa9996f60e95a10a4872439b5f5e874bc326267165d5c0eab7427d4a9dbaaede8867f22c37809bada22b6513a740d4b70555c7d93ab5f3f7b2d075a1eeee9f0a4e07bba3d74c64342a9d583b0d59d88272cb2fb0813263d56c86d559821caf871f9b7c5d732264e82f59c905b6860a875b28bebbe82dce65f13bf1413a3716fb22addab5297582",
            "ff9ab46a18006d7f11c1f7195af6251bfb35162edf6dbbb125c71145d9aa437d7ffd36a0ead69762ff256049add442d4b06bde117fb4d4aa84883f255f86b0a232174540307f5bce9fd473f0a7df0313075ce89de7c93ae76c673b19f9d5ce3c5686cbb74de60318f6429a6f7bb84474b7eeecb33357a6e53ebefc6997dd56394c1a9925eb4c50aa9f26ea49cb6e6a4f9b9af82479a90663afcafcb7b32429075ad8111238e48d42caddc3a739274df1d33cfe5394b7388cf5303d6720064eb3"
        ],
        password: "714810e2885d282237c058b24b796e98356c323e6afc7ecf0d16d9a4a5e18307",
        wid: "c9e3f15beade0d32ed4c4ff39a08dc508725ec0dc06e5e1ed76b5779bc298972",
    })
}

test_balance()
