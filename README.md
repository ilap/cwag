# Cardano Wallet Address Generator

It generates a valid Cardano Wallet Address.

> It currently generates only CwID.


## Installation

OS X & Linux:

```sh
$ git clone https://github.com/ilap/cwag.git
$ cd cwag && npm install
```

## Usage example

It's in a very early stage 'educational purposes only software' with no any error-handling whatsoever.


Replace the 12 words in the main.js

``` sh
var mnemonics = 'ring crime symptom enough erupt lady behave ramp apart settle citizen junk'
```

and run

``` sh
$ node main
```

## Sample Outputs 

``` sh
#### Step 1-2	: The 12-word Menonic phrase to a 132 bit Mnemonic(16+4bit) then to a 128 bit Entropy(16)
Mnemonic	: ring crime symptom enough erupt lady behave ramp apart settle citizen junk
Entropy(16)	: ba0673722574cef9051d8b0a588ca53c
Serialised	: 50ba0673722574cef9051d8b0a588ca53c

#### Step 3a	: 128bit Entropy(16) to Blake2b_SHA256 Seed(32)
Seed(32)	: 2ed4c71d91bc68c7b50feeb5bc7a785fe884dd0aeddce029df3d612cd3680fd3
Serialised	: 58202ed4c71d91bc68c7b50feeb5bc7a785fe884dd0aeddce029df3d612cd3680fd3

#### Step3b	: Spending password to EncryptedPass
Spending pass   :  ""
Serialised      :  40
Generated salt  :  582014c8f070fd924358ddc1b0453144f7f2b67e6fb7fd59bea5c773f5d7439f9d7a
Generated pass  :  e72067ee7e6ac05f94de8d3064e9bfaddcee812c5d0ca348bbcb122caeaf9f82
EncryptePass    :  Xd14|8|1|5yBn7n5qwF+U3o0wZOm/rdzugSxdDKNIu8sSLK6vn4I=|WCAUyPBw/ZJDWN3BsEUxRPfytn5vt/1ZvqXHc/XXQ5+deg==
Base64-ed       :  WGQxNHw4fDF8NXlCbjduNXF3RitVM28wd1pPbS9yZHp1Z1N4ZERLTkl1OHNTTEs2dm40ST18V0NBVXlQQncvWkpEV04zQnNFVXhSUGZ5dG41dnQvMVp2cVhIYy9YWFE1K2RlZz09

#### Step 4	: Generate a BIP-Ed25519 compatible keypair and the ChainCode from Seed
SecretKey(32)	: c291e884bc42e54a305367ad00f6efeccf50706f831ead0136bbe9ff02ec94c8
ChainCode(32)	: 739f4b3caca4c9ad4fcd4bdc2ef42c8601af8d6946999ef85ef6ae84f66e72eb

#### Step 5	: Generate the CwId (Cardano Wallet Id) from XPub (PublicKey + ChainCode)
XPub(64)	: 64b20fa082b3143d6b5eed42c6ef63f99599d0888afe060620abc1b319935fe1739f4b3caca4c9ad4fcd4bdc2ef42c8601af8d6946999ef85ef6ae84f66e72eb
addrRoot	: 83008200584064b20fa082b3143d6b5eed42c6ef63f99599d0888afe060620abc1b319935fe1739f4b3caca4c9ad4fcd4bdc2ef42c8601af8d6946999ef85ef6ae84f66e72eba0
SHA3 (32)	: 2ccccd277975a5c409353cdbeb6c7b17353d88362db5a94647547e191dcf8329
Blake2b (28)	: e822009e78492c1d2dbb0caa9dd141a079c26596c483b49d7db7ad54
CwID(Base58) 	: Ae2tdPwUPEZKyArxpKiJu9qDf4yrBb8mJc6aNqiNi72NqRkJKTmCXHJqWVE
Check with	: https://cardanoexplorer.com/api/addresses/summary/Ae2tdPwUPEZKyArxpKiJu9qDf4yrBb8mJc6aNqiNi72NqRkJKTmCXHJqWVE

```
or check with curl
``` json
$ curl "http://cardanoexplorer.com/api/addresses/summary/Ae2tdPwUPEZKyArxpKiJu9qDf4yrBb8mJc6aNqiNi72NqRkJKTmCXHJqWVE" | jq

{
  "Right": {
    "caAddress": "Ae2tdPwUPEZKyArxpKiJu9qDf4yrBb8mJc6aNqiNi72NqRkJKTmCXHJqWVE",
    "caType": "CPubKeyAddress",
    "caTxNum": 0,
    "caBalance": {
      "getCoin": "0"
    },
    "caTxList": []
  }
}

```

## Contributing

1. Fork it (<https://github.com/ilap/cwag/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request