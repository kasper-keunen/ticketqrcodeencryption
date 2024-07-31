import {
  readImage,
  encryptData,
  uploadToS3,
  convertImageToBase64,
  getSignedUrlForUpload,
  fetchFromIPFS,
  decryptData,
  saveDecryptedFile,
  redeemTicket,
} from "./scripts";
import EthCrypto from "eth-crypto";
import { task } from "hardhat/config";
import { ethers } from "ethers";
import dotenv from "dotenv";
import {
  CONTRACT_ADDRESS, RPC_BASE_URL, PRIVATE_KEY_OF_PROTOCOL, PRIVATE_KEY_DEPLOYER, PRIVATE_KEY_OF_NFT_OWNER
} from "./CONSTANTS";

dotenv.config();

const privateKeyTicketOwner = PRIVATE_KEY_OF_NFT_OWNER;

const privateKeyDeployer = PRIVATE_KEY_DEPLOYER;

if (!privateKeyTicketOwner) {
  throw new Error("Missing private key for ticket owner");
}

if (!privateKeyDeployer) {
  throw new Error("Missing private key for deployer");
}


task("redeem-ticket-and-encrypt-qr", "Redeem a ticket and encrypt the image with the public key of the nft owner")
  .addParam("qrPath", "The path to the image file (without the .png extension)")
  .addParam("tokenId", "The tokenId")
  .addParam("nftOwnerPublicKey", "The public key of the nft owner")
  .setAction(async (taskArgs, hre) => {
    // note: in the DAPP the public key should be provided by the user when they burn/redeem the NFT as we cannot get the public key from the private key (as we do not have access to that) - neither are we able to get the public key from the public address
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKeyTicketOwner);
    console.log("publicKey of ticket owner", publicKey);

    const provider = new ethers.JsonRpcProvider(RPC_BASE_URL);

    const wallet = new ethers.Wallet(privateKeyDeployer, provider);

    const abi = [
      "function returnTicketInfo(uint256 tokenId) external view returns(uint8,string,string,string,uint32,uint64,uint64,uint64)",
      "function encryptedDataPreRelease(uint256 tokenId) external view returns(string memory)"
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    try {
      const qrPath = taskArgs.qrPath;
      const tokenId = taskArgs.tokenId;
      const nftOwnerPublicKey = taskArgs.nftOwnerPublicKey;

      // const ticketInfo = await contract.returnTicketInfo(tokenId);
      // console.log("ticketInfo", ticketInfo);

      // // Fetch the ticketInfo hash from IPFS
      // const ticketInfoHash = ticketInfo.ticketMeta1; // Assuming ticketMeta1 contains the IPFS hash
      // console.log("ticketInfoHash", ticketInfoHash);

      // const ticketInfoData = await fetchFromIPFS(ticketInfoHash);
      // console.log("Fetched ticketInfo data from IPFS:", ticketInfoData.toString());

      // const decryptedData = await decryptData(ticketInfoData.toString(), privateKey);
      // console.log("decryptedData", decryptedData);

      // Construct the output path
      const fileNameFileBase = `qrcode${tokenId}-${Date.now()}.png`;
      console.log("File name: %s.", fileNameFileBase);

      const imageData = readImage(qrPath);
      const base64ImageData = convertImageToBase64(imageData);
      const encryptedData = await encryptData(base64ImageData, publicKey);

      const signedUrl = await getSignedUrlForUpload(fileNameFileBase, "image/png");
      console.log("signedUrl", signedUrl);
      await uploadToS3(signedUrl, Buffer.from(encryptedData));

      // await redeemTicket(tokenId, ipfsCid, providerUrl, privateKey);

    } catch (error) {
      console.error("Error:", error);
    }
  });

