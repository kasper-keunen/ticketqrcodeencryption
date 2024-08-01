import {
  readImage,
  encryptData,
  uploadToS3,
  convertImageToBase64,
  getSignedUrlForUpload,
  fetchFromIPFS,
  mintTicket,
  decryptData,
  saveFileToFolder,
} from "./scripts";
import { task } from "hardhat/config";
import dotenv from "dotenv";
import EthCrypto from "eth-crypto";
import {
  RPC_BASE_URL, PRIVATE_KEY_OF_PROTOCOL, PRIVATE_KEY_DEPLOYER
} from "./CONSTANTS";

dotenv.config();

task("mint-ticket-and-encrypt-qr", "Mint a ticket and encrypt the image with the public key of the protocol")
  .addParam("qrPath", "The path to the image file (without the .png extension)")
  .addParam("addressRecipient", "The address of the nft owner")
  .addParam("eventIndex", "The event index")
  .addParam("ipfsName", "The name of the file in the ipfs")
  .setAction(async (taskArgs, hre) => {

    const privateKeyProtocol = PRIVATE_KEY_OF_PROTOCOL;

    const privateKeyDeployer = PRIVATE_KEY_DEPLOYER;

    if (!privateKeyProtocol) {
      throw new Error("Missing private key x");
    }

    if (!privateKeyDeployer) {
      throw new Error("Missing private key for deployer");
    }

    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKeyProtocol);
    const addressProtocol = EthCrypto.publicKey.toAddress(publicKey);
    console.log("address of protocol", addressProtocol);

    try {
      const qrPath = taskArgs.qrPath;
      const providerUrl = RPC_BASE_URL;
      const addressRecipient = taskArgs.addressRecipient;
      const eventIndex = taskArgs.eventIndex;
      const ipfsName = taskArgs.ipfsName;

      const imageData = readImage(qrPath + ".png");
      const base64ImageData = convertImageToBase64(imageData);
      const encryptedData = await encryptData(base64ImageData, publicKey);

      // filename is the file name + time of encryption + public address used to encrypt
      const fileNameIPFS = `${ipfsName}-${Date.now()}-${addressProtocol}.png`;

      const signedUrl = await getSignedUrlForUpload(fileNameIPFS, "image/png");
      const ipfsCid = await uploadToS3(signedUrl, Buffer.from(encryptedData));

      // note this is redundant step mainly to register the QR codes that have been uploaded to the IPFS in encrypted form
      const ticketInfoData = await fetchFromIPFS(ipfsCid);

      const decryptedData = await decryptData(ticketInfoData.toString(), privateKeyProtocol);

      const pathDecryped_ = `./files/decrypted/${fileNameIPFS}`;

      // save the saveFileToFolder - to check if the decryption was successfull
      saveFileToFolder(decryptedData, pathDecryped_);

      await mintTicket(addressRecipient, ipfsCid, providerUrl, privateKeyDeployer, eventIndex);

    } catch (error) {
      console.error("Error:", error);
    }
  });

