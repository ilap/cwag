const bs58 = require('bs58')
const bip39 = require('bip39')
const blake = require('blakejs')
const crypto = require('crypto')
const scrypt = require('scrypt')
const sha3_256 = require('js-sha3').sha3_256;
const cbor = require('borc')
const CRC = require('crc')
const ed25519 = require('bip-ed25519')

//
// Start
//
// 
// It generates a valid Cardano address based from a 12-word BIP39 mnemonic.
// 1. Generate 128 bit Entropy from known mnemonics
// 2. Generate entropy from mnemonic, simple remove last 4 bits.
msg("#### Step 1-2", "The 12-word Menonic phrase to a 132 bit Mnemonic(16+4bit) then to a 128 bit Entropy(16)")

var mnemonics = 'ring crime symptom enough erupt lady behave ramp apart settle citizen junk'
msg("Mnemonic", mnemonics)

var entropy = bip39.mnemonicToEntropy(mnemonics)
var cborEnt = cbor.encode(new Buffer(entropy, 'hex'), 'hex')

msg("Entropy(16)", entropy)
msg("Serialised", cborEnt.toString("hex")) // serialise w/ CBOR

// 3. Generate Seed(32), simply means Blake2b_256 the CBORED entropy
console.log()
msg("#### Step 3a", "128bit Entropy(16) to Blake2b_SHA256 Seed(32)")

var seed = blake.blake2bHex(cborEnt, null, 32)
msg("Seed(32)", seed)

var cborSeed = cbor.encode(new Buffer(seed, 'hex'), 'hex') // CBOR(bytestring) the normal seed (hashed entropy)
msg("Serialised", cborSeed.toString("hex"))

// TODO: The password protected Wallets are currently not suppoerted.
let passPhrase = "" // Wallet/Spending password is "" in defeault.

console.log()
msg("#### Step3b", "Spending password to EncryptedPass")
console.log("Spending pass   : ", "\"" + passPhrase + "\"")

// Serialise the spending password
passPhrase = cbor.encode(new Buffer(passPhrase), 'hex')
console.log("Serialised      : ", passPhrase.toString("hex"))

// Serialise the seed again and then hash it
seedBuf = cbor.encode(cborSeed, 'hex')

// Generate the salt which is the blake2b_256 of the serialised seed. 
var hashedSeed = blake.blake2bHex(seedBuf, null, 32)
salt = cbor.encode(new Buffer(hashedSeed, 'hex'), 'hex') 

console.log("Generated salt  : ", salt.toString("hex"))

var N = 16384, 
    n = Math.log2(16384), // It's needed for EncryptePass' string generation
    r = 8,
    p = 1

// PBKDF hash the spending password /w the salt
var hashedPass = scrypt.hashSync(passPhrase, {"N":N,"r":r,"p":p}, 32, salt);
console.log("Generated pass  : ", hashedPass.toString("hex"))

// Build password hash similar to the Haskel's Crypto.Scrypt EncryptedPass format
// e.g.: 14|8|1|5yBn7n5qwF+U3o0wZOm/rdzugSxdDKNIu8sSLK6vn4I=|WCAUyPBw/ZJDWN3BsEUxRPfytn5vt/1ZvqXHc/XXQ5+deg==
var encryptedPass = n  + "|" + r + "|" + p + "|" + hashedPass.toString('base64') + "|" + salt.toString('base64')

// serialise the encryptedPass
var encryptedPass = cbor.encode(new Buffer(encryptedPass))
console.log("EncryptePass    : ", encryptedPass.toString())
console.log("Base64-ed       : ", new Buffer(encryptedPass).toString('base64'))

console.log()
msg("#### Step 4", "Generate a BIP-Ed25519 compatible keypair and the ChainCode from Seed")

// 4. Use the seed(32) to generate the BIP-Ed25519 compatible keypair and
// them construct the XPriv(128) using the folowing formula. 
// XPriv(128) : { PrivateKey(64), XPub(64):{ PublicKey/iL(32), ChainCode/iR (32) }}
// [PrivateKey(64).................|PublicKey(32)....|ChainCode(32)...]

// The generate() uses the BIP-Ed25519 variation of the Ed25519-donna.
// Slightly modified by IOHK and adopted to node.js by the me.
let XPriv = generate(cborSeed, passPhrase)

if (XPriv == null) {
    console.log("Exiting... Could not generate any BIP-Ed25519 compatible keypair.")
    return
}

// Info only!
// Now, we have a BIP32-Ed25519 PrivateKey(64) and PublicKey/iL(32), and the ChainCode/iR(32)
// We can compose the EncryptedKey(128): {
//   XPriv: {
//      PrivateKey,
//      XPub: {
//         PublicKey, 
//         ChainCode
//      }
//    },
//    // We do not compute it now.
//    HashedPassword: It's Scrypt("14|8|1") of the blacke2b_256 hashed password.
//  }


// 5.
// We generate the CwId (Cardano Wallet Id) from the XPub (PublicKey + ChainCode)
console.log()
msg("#### Step 5", "Generate the CwId (Cardano Wallet Id) from XPub (PublicKey + ChainCode)")

var xpub = Buffer.concat([XPriv.XPub.PublicKey, XPriv.XPub.ChainCode])
msg("XPub(64)", xpub.toString('hex'))

/* The structure of the Address is:
// See details: https://cardanodocs.com/cardano/addresses/
Address {
	addrRoot = AbstractHash // see details below.
	addrAttributes = Attributes { 
		data:  AddrAttributes {aaPkDerivationPath = Nothing, aaStakeDistribution = BootstrapEraDistr} 
    }, 
	addrType = ATPubKey
}
*/

// Construct and hash the addrRoot for the Address.
// TODO: It's oversimplified now and should need some more generalised 
// Address construction.
// 6. Variables
let addrType = 0        // addrType, 0 means ATPubkey, 1 = ATScript, 2 = ATRedeem and 3 = ATUknown.
let addrAttributes = {} // addrAttributes, empty for a root CwID.
let addrRoot =  [        // addrSpendingData, is a serialised type and payload i.e. serialized 0 and serialized pubkey by CBOR.
    addrType,          
    [ addrType, xpub ], 
    addrAttributes          
]

// 6.1 Compute abstractHash, means double hash the CBOR serialised addrRoot
addrRoot = cbor.encode(addrRoot) // serialise all components of the addrRoot.
msg("addrRoot", addrRoot.toString('hex'))

// SHA3 hash the addrRoot
let sha3 = sha3_256(addrRoot)
sha3 = new Buffer(sha3, 'hex');
msg("SHA3 (32)", sha3.toString('hex'))
// 2nd Hash it w/ Blake2b_224 
addrRoot = blake.blake2bHex(sha3, null, 28)

// convert digest to Buffer
abstractHash = new Buffer(addrRoot, 'hex')
msg("Blake2b (28)", abstractHash.toString('hex'))

// b.2 Serialise the address structure.
let address = [ 
    abstractHash,
    addrAttributes,
    addrType 
]
address = cbor.encode(address)

// Calculate the CRC32 of the serialised address
let crc = CRC.crc32(address)

taggedAddress = new cbor.Tagged(24, address) // They use Tag 24 (ByteString) in cardano-sl

let cwid = cbor.encode([taggedAddress, crc])
cwid = bs58.encode(cwid)
// And finally Base58 encode the cwid as it can be seen in the Cardano backend API.

msg("CwID(Base58) ", cwid)
msg("Check with", "https://cardanoexplorer.com/api/addresses/summary/" + cwid)

//
// It generates a valid BIP-Ed25519 Keypair from the seed
//
function generate(seed, passhPhrase) {

    let valid = false,
        i = 1,
        phrase = "Root Seed Chain ",  // It's is used for BIP32-ed25519 validity.
        XPriv = null,
        bip32 = null

    while (!valid) {
        // 4.1.1 HMAC_SHA51(seed) wit "Root Seed Chain i", i=1..n.
        // We try to find a valid HMAC-SHA512 for the BIP32-Ed24419 by using different phrase
        // until the found digest is valid for BIP32-Ed25519.
        // e.g. "Root Seed Chain 1" a phrase for streching the seed for validity.
        // It's a 1 bit check, means the probability is 50% to find one, but we should loop until
        // we find one. Usually, we find one in a few tries.
        ph = phrase + i
        hmac = crypto.createHmac('sha512', seed)
        hmac.update(ph) // Hash the seed w/ the phrase.

        hmac512 = hmac.digest()

        // 4.1.2 Create SecretKey/iL (32) and ChainCode (32) from the HMAC-SHA512's keyed-
        // hash of the Seed(32)
        // SecretKey is simply the first 32 bytes of the hash, called iL.
        // ChainCode is the rest iR.
        var iL = new Buffer(hmac512.slice(0, 32)) // SecretKey
        var iR = new Buffer(hmac512.slice(32, 64)) // ChainCode

        // 4.1.3 Extend the SecretKey(32) to 64 byte extSk
        // INFO: Informational only, as We do not need this as we use 
        // BIP32-Ed25519 package
        /*
        var digest = crypto.createHash('sha512').update(iL).digest('hex')
        var sha512 = new Buffer(digest, 'hex')
        console.log("extSk candidate: " + digest)   

        // 4.1.4 Set the bits required for BIP32-Ed25519
        // Set and Check bits, order is not important
        // Set
        sha512[0] &= 248;
        sha512[31] &= 127;
        sha512[31] |= 64;
        
        // Check
        // Bip32-Ed25519 requires that the 3rd highest bit of the extSk[31] is unset
        valid = (sha512[31] & 0x20) == 0
        */
        try {
            bip32 = ed25519.MakeKeypair(iL);
            XPriv = { 
                PrivateKey: new Buffer(bip32.privateKey, 'hex'),
                XPub: {
                    PublicKey: new Buffer(bip32.publicKey, 'hex'),
                    ChainCode: iR
                }
            }

            msg("SecretKey(32)", iL.toString('hex'))
            msg("ChainCode(32)", iR.toString('hex'))

            valid = true

        } catch (err) {
            // TODO: Handle the error properly.
            if (!err.message == "Not a valid BIP32-Ed25519 seed" || (i++ >= 1000)) {
                break
            }
        }
    }

    return XPriv
}

function msg(msgId, msg) {
    console.log(msgId + "\t: " + msg)
}
