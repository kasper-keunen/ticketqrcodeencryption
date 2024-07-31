### Encryption flow

Note; it is not possible to encrypt data with the public key address of the wallet, in order for the data to be
encrypted with the public key of the wallet. The public key cannot be derived from the public key address but it can be
derived from the private key. A user can safely provide the public key of their wallet to anybody without it being
unsafe. The following metamask command can request the public key of the wallet:
https://docs.metamask.io/wallet/reference/eth_getencryptionpublickey/. In the front-end

```
const publicKey = await ethers.getPublicKey(privateKey);
```

nftOwnerPublicKey

```
 npx hardhat redeem-ticket-and-encrypt-qr --qr-path ./files/qrcode --token-id 6 --file-name qrcode2.png --nft-owner-public-key 0x77fa13A68e0a8CA0e196c7B9B92f12d8a27Bce98
```

```
npx hardhat mint-ticket-and-encrypt-qr --qr-path ./files/qrcode --address-recipient 0x77fa13A68e0a8CA0e196c7B9B92f12d8a27Bce98 --event-index 1 --ipfs-name qrcode
```

### Keys

Protocol public address: 0x3a4f2515212608443577a2ce55f66ea83b54b9bb Private key variable in .env: PK_3A -> PK_PROTOCOL

Ticket owner public address: 0x8971bd2afa27c06961c500628643e2ed71399e32 Private key variable in .env: PK_89 ->
PK_NFT_OWNER

Protocol deployer public address: 0x87071d30c42fae32cccb7396c5f10fe458612471 Private key variable in .env: PK_87 ->
PK_PROTOCOL_DEPLOYER
