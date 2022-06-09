const {
    Transaction, TransactionInstruction,
    SystemProgram, PublicKey, Account,
    SYSVAR_RENT_PUBKEY, Keypair, Connection,
    clusterApiUrl
} = require('@solana/web3.js');

const {Token, TOKEN_PROGRAM_ID} = require("@solana/spl-token");
const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo',);
const BufferLayout = require('buffer-layout');
const SHA256 = require("crypto-js/sha256");
const BN = require('bn.js');


function encodeOwnerValidationInstruction(instruction) {
    const OWNER_VALIDATION_LAYOUT = BufferLayout.struct([
        new PublicKeyLayout('account'),
    ]);
    const b = Buffer.alloc(OWNER_VALIDATION_LAYOUT.span);
    const span = OWNER_VALIDATION_LAYOUT.encode(instruction, b);
    return b.slice(0, span);
}

const LAYOUT = BufferLayout.union(BufferLayout.u8('instruction'));
LAYOUT.addVariant(
    0,
    BufferLayout.struct([
        BufferLayout.u8('decimals'),
        BufferLayout.blob(32, 'mintAuthority'),
        BufferLayout.u8('freezeAuthorityOption'),
        BufferLayout.blob(32, 'freezeAuthority'),
    ]),
    'initializeMint',
);
LAYOUT.addVariant(1, BufferLayout.struct([]), 'initializeAccount');
LAYOUT.addVariant(
    3,
    BufferLayout.struct([BufferLayout.nu64('amount')]),
    'transfer',
);
LAYOUT.addVariant(
    7,
    BufferLayout.struct([BufferLayout.nu64('amount')]),
    'mintTo',
);
LAYOUT.addVariant(
    8,
    BufferLayout.struct([BufferLayout.nu64('amount')]),
    'burn',
);
LAYOUT.addVariant(9, BufferLayout.struct([]), 'closeAccount');

const instructionMaxSpan = Math.max(
    ...Object.values(LAYOUT.registry).map((r) => r.span),
);

function encodeTokenInstructionData(instruction) {
    let b = Buffer.alloc(instructionMaxSpan);
    let span = LAYOUT.encode(instruction, b);
    return b.slice(0, span);
}

class PublicKeyLayout extends BufferLayout.Blob {
    constructor(property) {
        super(32, property);
    }

    decode(b, offset) {
        return new PublicKey(super.decode(b, offset));
    }

    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
function createProgramAddress(seeds, programId) {
    let buffer$1 = Buffer.alloc(0);
    seeds.forEach(function (seed) {
        buffer$1 = Buffer.concat([buffer$1, seed]);
    });
    buffer$1 = Buffer.concat([buffer$1, programId.toBuffer(), Buffer.from('ProgramDerivedAddress')]);
    let hash = SHA256(new Uint8Array(buffer$1));
    let publicKeyBytes = new BN(hash, 16).toArray(undefined, 32);

    return new PublicKey(publicKeyBytes);
}

function findAssociatedTokenAddress(toPubkey, contract) {
    const seeds = [
        toPubkey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        contract.toBuffer(),
    ];
    const programId = ASSOCIATED_TOKEN_PROGRAM_ID;
    let nonce = 255;
    let address;
    while (nonce != 0) {
        try {
            const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
            address = createProgramAddress(seedsWithNonce, programId);
        } catch (err) {
            if (err instanceof TypeError) {
                throw err;
            }
            nonce--;
            continue;
        }
        return address;
    }
    throw new Error(`Unable to find a viable program address nonce`);
}

function createAssociatedTokenAccountIx(fromPubkey, toPubkey, contract) {
    const associatedTokenAddress = findAssociatedTokenAddress(toPubkey, contract);
    const systemProgramId = new PublicKey('11111111111111111111111111111111');
    const keys = [
        { pubkey: fromPubkey, isSigner: true, isWritable: true, },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true, },
        { pubkey: toPubkey, isSigner: false, isWritable: false,},
        { pubkey: contract, isSigner: false, isWritable: false, },
        { pubkey: systemProgramId, isSigner: false, isWritable: false,},
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false,},
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false,},
    ];
    const ix = new TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
    return [ix, associatedTokenAddress];
}
class Transfer {
    constructor() {

    }

    trnasfer(fromPubkey, toPubkey, amount) {

        const transferIx = SystemProgram.transfer({
            fromPubkey: fromPubkey,
            toPubkey: toPubkey,
            lamports: amount,
        });
        const transaction = new Transaction();
        transaction.add(transferIx);
        return transaction;
    }

    async transferToken(contractPublic, fromSourcePublic, toSourcePublic, amount, memo, wallet) {
        const transaction = new Transaction();
        let connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
        console.log("TransferToken 01")
        let myToken = new Token(
            connection,
            contractPublic,
            TOKEN_PROGRAM_ID,
            wallet
        );
        console.log("TransferToken 02",fromSourcePublic.toString())
        let fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(fromSourcePublic)
        console.log("TransferToken 03",toSourcePublic.toString())
        let toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(toSourcePublic)
        console.log("TransferToken 04")
        let transactionInstruction = Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromSourcePublic,
            [],
            amount
        );
        console.log("TransferToken 05")
        if (memo) {
            transactionInstruction.add(
                new TransactionInstruction({
                    keys: [],
                    data: Buffer.from(memo, 'utf-8'),
                    programId: MEMO_PROGRAM_ID
                })
            );
        }
        console.log("TransferToken 06")
        transaction.add(transactionInstruction);
        return transaction;
    }
}

module.exports = Transfer;
