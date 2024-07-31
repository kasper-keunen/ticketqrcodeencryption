### Encryption flow

Note; it is not possible to encrypt data with the public key address of the wallet, in order for the data to be
encrypted with the public key of the wallet. The public key cannot be derived from the public key address but it can be
derived from the private key. A user can safely provide the public key of their wallet to anybody without it being
unsafe. The following metamask command can request the public key of the wallet:
https://docs.metamask.io/wallet/reference/eth_getencryptionpublickey/. In the front-end

```
const publicKey = await ethers.getPublicKey(privateKey);
```

// npx hardhat encrypt-and-pin --image-path ./files/qrcode1.png --token-id 1 --file-name qrcode1.png


### Keys

Protocol public address: 0x3a4f2515212608443577a2ce55f66ea83b54b9bb
Private key variable in .env: PK_3A

Ticket owner public address: 0x8971bd2afa27c06961c500628643e2ed71399e32
Private key variable in .env: PK_89

Protocol deployer public address: 0x87071d30c42fae32cccb7396c5f10fe458612471
Private key variable in .env: PK_87
