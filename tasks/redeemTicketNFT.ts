import {
  readImage,
  encryptData,
  uploadToS3,
  convertImageToBase64,
  getSignedUrlForUpload,
  fetchFromIPFS,
  decryptData,
  saveFileToFolder,
  redeemTicketByOwner,
  redeemTicketByProtocol
} from "./scripts";
import EthCrypto from "eth-crypto";
import { task } from "hardhat/config";
import { ethers } from "ethers";
import dotenv from "dotenv";
import {
  CONTRACT_ADDRESS, RPC_BASE_URL, PRIVATE_KEY_OF_PROTOCOL, PRIVATE_KEY_DEPLOYER, PRIVATE_KEY_OF_NFT_OWNER
} from "./CONSTANTS";

dotenv.config();

task("redeem-ticket-and-encrypt-qr", "Redeem a ticket and encrypt the image with the public key of the nft owner")
  .addParam("tokenId", "The tokenId")
  .addOptionalParam("publicKeyOfOwner", "The public key of the owner of the ticket")
  .addOptionalParam("privateKeyOwner", "The private key of the owner of the ticket")
  .setAction(async (taskArgs, hre) => {
    // note: in the DAPP the public key should be provided by the user when they burn/redeem the NFT as we cannot get the public key from the private key (as we do not have access to that) - neither are we able to get the public key from the public address
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

    let publicKeyTicketOwner;
    let publicAddressForEncryption;

    if (taskArgs.publicKeyOfOwner) {
      publicKeyTicketOwner = taskArgs.publicKeyOfOwner;
      publicAddressForEncryption = EthCrypto.publicKey.toAddress(publicKeyTicketOwner);
      console.log("publicAddressForEncryption", publicAddressForEncryption);
      console.log("publicKeyTicketOwner", publicKeyTicketOwner);
    } else {
      publicKeyTicketOwner = EthCrypto.publicKeyByPrivateKey(privateKeyDeployer);
      publicAddressForEncryption = EthCrypto.publicKey.toAddress(publicKeyTicketOwner);
      console.log("publicAddressForEncryption", publicAddressForEncryption);
      console.log("publicKeyTicketOwner", publicKeyTicketOwner);
    }

    let privateKeyExecutor;
    let isByOwner; // if true the transaction is initiated by the owner of the ticket, if false by the protocol
    if (taskArgs.privateKeyOwner) {
      console.log("Redeeming ticket - transaction initiated by owner");
      isByOwner = true;
      privateKeyExecutor = taskArgs.privateKeyOwner;
    } else {
      console.log("Redeeming ticket - transaction initiated by protocol");
      isByOwner = false;
      privateKeyExecutor = privateKeyDeployer;
    }

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
      saveFileToFolder(decryptedData, pathDecryped_);

      const nameRedeemed = `redeemed-nft-index:${tokenId}:redeemer:${ownerAddress}:redeemed-at:`

      const fileNameIPFS = `${nameRedeemed}${Date.now()}.png`
      console.log("fileNameIPFS", fileNameIPFS);

      const imageData = readImage(pathDecryped_);
      const base64ImageData = convertImageToBase64(imageData);
      const encryptedDataEncrypted = await encryptData(base64ImageData, publicKeyTicketOwner);

      const signedUrl = await getSignedUrlForUpload(fileNameIPFS, "image/png");
      const ipfsCid = await uploadToS3(signedUrl, Buffer.from(encryptedDataEncrypted));

      const pathEncrypted = `./files/redeemed/encrypted/${fileNameIPFS}-${publicAddressForEncryption}.png`;

      // save the saveFileToFolder - to check if the decryption was successfull
      saveFileToFolder(encryptedDataEncrypted, pathEncrypted);

      if (isByOwner) {
        await redeemTicketByOwner(tokenId, ipfsCid, RPC_BASE_URL, privateKeyExecutor);
      } else {
        await redeemTicketByProtocol(tokenId, ipfsCid, RPC_BASE_URL, privateKeyExecutor);
      }

    } catch (error) {
      console.error("Error:", error);
    }
  });

