const { encodeShard, decodeShard} = require('./index');

async function test() {
    // let result = encodeShard({
    //     shards:'abb abb df sdf d s fs adf asd f sad fdsf',
    //     password:'e807f1fcf82d132f9bb018ca6738a19f1',
    //     wid:'123',
    // })
    let resultArr=[
        '87a9b21aa2eef8728bac3d2aa4c2153bc758de641fd56b6d1acac2e5f327a916246b936ca8fc4b9b14104d98d7c6cb6ac37300a7becf6f04cfba440f2aa41f1c9eb6259b913a934eacaddc5505b1cd015f415c5546173e75871873a0b3b4b2e285b805b1d415162bb3305b9b9388f5b4',
        'b14fc14ccb21626d662767b5b74c8a2d80852b8fa7d8d348233a68eb19f5238979191ced3b57892b6e26ecae7e423b1c27e17049fd87b407ed2331338ce9ec2e3d149b517e200783aa2694cf2c735836b57ca4d444fa2f5784e0f7987e8d6c50551fa02a64d2891395d646473b26a6df',
        'f876b6e331c7e301bea048f5b9060c9fea0b9a55f51f6904ccf142371cbc0a2965ab625664418982adc00e4547ea777674b26b2bd70eecc8573abf54586ad152399eb1c95c11d178edc0aabc3f52415a3944851e435758cb00c8e22a8fe2e8d3f40eb43c7de0feeec44049fdf481aa3e'
    ]

    try {
        let result = decodeShard({
            shards: resultArr,
            password: 'e807f1fcf82d132f9bb018ca6738a19f11',
            // wid:'e807f1fcf82d132f9bb018ca6738a19f',
            wid: '123',
        })

        console.log(result);
    } catch (e) {
        console.log(e.message)
    }
}
test()
