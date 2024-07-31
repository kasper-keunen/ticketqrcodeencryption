import EthCrypto from "eth-crypto";
import { task } from "hardhat/config";

task("get-public-key-from-private-key", "Get the public key from the private key")
  .addParam("privateKey", "The private key")
  .setAction(async (taskArgs) => {
    const privateKey = taskArgs.privateKey;
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
    console.log("Public Key:", publicKey);
  });
