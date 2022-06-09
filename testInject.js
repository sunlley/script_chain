
const Provider = require('./inject/provider');


async function test(){
    const provider = new Provider({
        chainId:'0x1',
        rpcUrl:'',
        isDebug:true,
        address:'0x766f3377497C66c31a5692A435cF3E72Dcc2d4Fc'
    })
    provider.on('connect',()=>{
        console.log('Provider','connect');
    })
    provider.postMessage=(handler, id, data)=>{
        console.log('Provider','postMessage',{handler, id, data})
    }
    provider.enable();

}
test()
