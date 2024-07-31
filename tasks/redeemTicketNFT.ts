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
const privateKeyProtocol = PRIVATE_KEY_OF_PROTOCOL;

if (!privateKeyTicketOwner) {
  throw new Error("Missing private key for ticket owner");
}

if (!privateKeyDeployer) {
  throw new Error("Missing private key for deployer");
}

if (!privateKeyProtocol) {
  throw new Error("Missing private key for protocol");
}

task("redeem-ticket-and-encrypt-qr", "Redeem a ticket and encrypt the image with the public key of the nft owner")
  .addParam("tokenId", "The tokenId")
  .addOptionalParam("publicKeyOfOwner", "The public key of the owner of the ticket")
  .setAction(async (taskArgs, hre) => {
    // note: in the DAPP the public key should be provided by the user when they burn/redeem the NFT as we cannot get the public key from the private key (as we do not have access to that) - neither are we able to get the public key from the public address
    const publicKeyTicketOwner = taskArgs.publicKeyOfOwner || EthCrypto.publicKeyByPrivateKey(privateKeyTicketOwner);
    console.log("publicKeyTicketOwner of ticket owner", publicKeyTicketOwner);


    const provider = new ethers.JsonRpcProvider(RPC_BASE_URL);

    const wallet = new ethers.Wallet(privateKeyDeployer, provider);

    const abi = [
      "function returnTicketInfo(uint256 tokenId) external view returns(uint8,string,string,string,uint32,uint64,uint64,uint64)",
      "function encryptedDataPreRelease(uint256 tokenId) external view returns(string memory)",
      "function ownerOf(uint256 tokenId) external view returns (address)"
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    try {
      const tokenId = taskArgs.tokenId;

      const ownerAddress = await contract.ownerOf(tokenId);
      console.log("ownerAddress", ownerAddress);

      const hashIPFS = await contract.encryptedDataPreRelease(tokenId);
      console.log("hashIPFS", hashIPFS);

      const ticketInfoData = await fetchFromIPFS(hashIPFS);
      console.log("Fetched ticketInfo data from IPFS:", ticketInfoData.toString());
      const decryptedData = await decryptData(ticketInfoData.toString(), privateKeyProtocol);

      const pathDecryped_ = `./files/redeemed/redeemed-nft-index:${tokenId}.png`;
      saveDecryptedFile(decryptedData, pathDecryped_);

      const encryptedData = await encryptData(decryptedData, publicKeyTicketOwner);

      const nameRedeemed = `redeemed-nft-index:${tokenId}:redeemer:${ownerAddress}:redeemed-at:`

      const fileNameIPFS = `${nameRedeemed}${Date.now()}.png`

      const signedUrl = await getSignedUrlForUpload(fileNameIPFS, "image/png");
      const ipfsCid = await uploadToS3(signedUrl, Buffer.from(encryptedData));

      const ticketInfoData2 = await fetchFromIPFS(ipfsCid);
      const decryptedData2 = await decryptData(ticketInfoData2.toString(), privateKeyProtocol);

      const pathDecryped2_ = `./files/redeemed/encrypted/${fileNameIPFS}`;

      // save the saveDecryptedFile - to check if the decryption was successfull
      saveDecryptedFile(decryptedData2, pathDecryped2_);

      // const imageData = readImage(qrPath);
      // const base64ImageData = convertImageToBase64(imageData);
      // const encryptedData = await encryptData(base64ImageData, publicKeyTicketOwner);

      // const signedUrl = await getSignedUrlForUpload(fileNameFileBase, "image/png");
      // console.log("signedUrl", signedUrl);
      // await uploadToS3(signedUrl, Buffer.from(encryptedData));

      // await redeemTicket(tokenId, ipfsCid, providerUrl, privateKey);

    } catch (error) {
      console.error("Error:", error);
    }
  });

