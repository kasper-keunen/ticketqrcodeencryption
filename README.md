# Ticket QR Code Encryption

This repo is a proof of concept for the ticket QR code encryption and decryption. It is a simple implementation of the
ticket QR code encryption and decryption protocol. The repo uses IPFS to pin the QR code to the IPFS network and uses
the Ethereum public key to encrypt the QR code.

### Installation

```
yarn install
```

#### Configuration

Create a .env file and add the following environment variables:

```
FB_API_KEY= FileBase API key
FB_SECRET_ACCESS_KEY= FileBase secret access key
FB_ACCESS_KEY_ID= FileBase access key id
INFURA_API_KEY= Infura API key

PK_3A= Private key of the protocol (used to derive public key and encrypt the QR code before redeem)
PK_89= Private key of the ticket owner (used to derive public key and encrypt the QR code before redeem)
PK_87= Private key of the protocol deployer (used to derive public key and encrypt the QR code before redeem)
MNEMONIC=PK_3A

```

note: the public/private key of the 'ticket owner' in this repo is a placeholder, the actual public/private key of the
ticket owner is derived from the private key of the wallet that is used to redeem the ticket.

---

### Encryption flow on mint

When a ticket is minted the following steps are taken:

1. The QR code is encrypted with the protocol public key.
2. The QR code is pinned to the IPFS network.
3. The QR code is stored on the nft.

The purpose of pinning the QR code to the IPFS network is to ensure that the QR code is not lost and that there is a
backup in case the QR code is lost in the database/dapp.

### Encryption flow on redeem

When a ticket is redeemed the following steps are taken:

1. The encrypted QR code is retrieved from IPFS by reading the IPFS hash from the nft.
2. The QR code is decrypted with the private key of the protocol as the decryption key.
3. The user that redeems needs to provide the DAPP with the public key (not public address) of their wallet. This is a
   supported call in all wallets (see below)
4. The QR code is then encrypted with the public key of the ticket owner (so the user redeeming the ticket).
5. The encrypted QR code is stored in IPFS and the IPFS hash is stored on the nft.
6. In the DAPP the user would also be able to download the QR code at the end of this step, the encryped QR code in IPFS
   then serves the purpose of backup if the user loses the QR code locally

#### Retrieving the public key of the wallet

Note; it is not possible to encrypt data with the public key address of the wallet, in order for the data to be
encrypted with the public key of the wallet. The public key cannot be derived from the public key address but it can be
derived from the private key. A user can safely provide the public key of their wallet to anybody without it being
unsafe. The following metamask command can request the public key of the wallet:
https://docs.metamask.io/wallet/reference/eth_getencryptionpublickey/. In the front-end

```
const publicKey = await ethers.getPublicKey(privateKey);
```

### Getting public key from private key

The script below can be used to get the public key from the private key. This is useful to get the public key of the
wallet and to test the encryption and decryption of the QR code.

```
npx hardhat get-public-key-from-private-key --private-key PRIVATE_KEY
```

---

### Minting a ticket and encrypting QR code

The script below can be used to mint a ticket and encrypt the QR code. The QR code is encrypted with the protocol public
key.

```
npx hardhat mint-ticket-and-encrypt-qr --qr-path ./files/qrcode --address-recipient 0x366B5DCA2221fc97456079fBb4f4B61C16C523AA --event-index 1 --ipfs-name qrcodez
```

---

### Redeeming a ticket with QR code

The script below can be used to redeem a ticket and encrypt the QR code. The QR code is encrypted with the public key of
the ticket owner.

```
 npx hardhat redeem-ticket-and-encrypt-qr --qr-path ./files/qrcode --token-id 6 --file-name qrcode2.png --nft-owner-public-key 0x77fa13A68e0a8CA0e196c7B9B92f12d8a27Bce98
```

---

### Testing keys to use this repo

#### Protocol public key

Protocol public address: 0x3a4f2515212608443577a2ce55f66ea83b54b9bb Private key variable in .env: PK_PROTOCOL

#### Ticket owner public key

Ticket owner public address: 0x8971bd2afa27c06961c500628643e2ed71399e32 Private key variable in .env: PK_NFT_OWNER
PK_NFT_OWNER

#### Protocol deployer public key

Protocol deployer public address: 0x87071d30c42fae32cccb7396c5f10fe458612471 Private key variable in .env:
PK_PROTOCOL_DEPLOYER

---

### Stack used

- Solidity
- Hardhat
- Typescript
- Ethers
- IPFS
