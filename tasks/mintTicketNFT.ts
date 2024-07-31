import {
  readImage,
  encryptData,
  uploadToS3,
  convertImageToBase64,
  getSignedUrlForUpload,
  pinToIPFS,
  redeemTicket,
} from "./ipfsScript";
import EthCrypto from "eth-crypto";
import { task } from "hardhat/config";
import { CONTRACT_ADDRESS, RPC_BASE_URL, PRIVATE_KEY_0XCC } from "./CONSTANTS";


task("encrypt-and-pin", "Encrypts an image and pins it to IPFS")
  .addParam("imagePath", "The path to the image file")
  .addParam("tokenId", "The tokenId")
  .setAction(async (taskArgs, hre) => {
    const publicKey = EthCrypto.publicKeyByPrivateKey(PRIVATE_KEY_0XCC);

    try {
      const filePath = taskArgs.imagePath;
      const providerUrl = RPC_BASE_URL;
      const tokenId = taskArgs.tokenId;

      const imageData = readImage(filePath);
      const base64ImageData = convertImageToBase64(imageData);
      const encryptedData = await encryptData(base64ImageData, publicKey);

      const signedUrl = await getSignedUrlForUpload("axww2wxx.png", "image/png");
      console.log("signedUrl", signedUrl);
      await uploadToS3(signedUrl, Buffer.from(encryptedData));

      // const ipfsCid = await pinToIPFS(Buffer.from(encryptedData));
      // console.log("ipfsCid", ipfsCid);

      // await redeemTicket(tokenId, ipfsCid, providerUrl, privateKey);
    } catch (error) {
      console.error("Error:", error);
    }
  });

