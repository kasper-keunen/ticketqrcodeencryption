import {
  fetchFromIPFS,
  decryptData,
  saveFileToFolder,
} from "./scripts";
import EthCrypto from "eth-crypto";
import { task } from "hardhat/config";
import { ethers } from "ethers";
import dotenv from "dotenv";
import {
  CONTRACT_ADDRESS, RPC_BASE_URL
} from "./CONSTANTS";

dotenv.config();


task("decrypt-ticket-ipfs", "Decrypt the ticket from a redeemed ticket by the user that redeemed the ticket")
  .addParam("tokenId", "The id of the ticket")
  .addParam("privateKeyOfOwner", "The private key of the owner used to decrypt the ticket")
  .setAction(async (taskArgs, hre) => {

    const abi = [
      "function returnTicketInfo(uint256 tokenId) external view returns(uint8,string,string,string,uint32,uint64,uint64,uint64)",
      "function encryptedDataPreRelease(uint256 tokenId) external view returns(string memory)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function returnRedeemerAddress(uint256 tokenId) external view returns (address)",
      "function encryptedDataPostRelease(uint256 tokenId) external view returns (string memory)"
    ];

    try {
      const tokenId = taskArgs.tokenId;
      const privateKeyOfOwner = taskArgs.privateKeyOfOwner;

      const provider = new ethers.JsonRpcProvider(RPC_BASE_URL);

      const wallet = new ethers.Wallet(privateKeyOfOwner, provider);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

      const publicKey = EthCrypto.publicKeyByPrivateKey(privateKeyOfOwner);
      console.log("publicKey", publicKey);

      const address = EthCrypto.publicKey.toAddress(publicKey);
      console.log("address", address);

      const redeemerAddress = await contract.returnRedeemerAddress(tokenId);
      console.log("redeemerAddress", redeemerAddress);

      // check if redeemerAddress is the same as caller address
      if (redeemerAddress !== address) {
        console.log("Redeemer address is not the same as the owner address");
        // needs to revert as the decryption will not work anyways
        throw new Error("Redeemer address is not the same as the owner address - decryption will not work");
      }

      const hashIPFS = await contract.encryptedDataPostRelease(tokenId);
      console.log("hashIPFS of encrypted data: ", hashIPFS);

      const ticketInfoData = await fetchFromIPFS(hashIPFS);
      console.log("Fetched ticketInfo data from IPFS: ", ticketInfoData.toString());
      const decryptedData = await decryptData(ticketInfoData.toString(), privateKeyOfOwner);

      const pathDecryped_ = `./files/redeemed/redeemed-nft-index:${tokenId}.png`;

      // save the saveFileToFolder - to check if the decryption was successfull
      saveFileToFolder(decryptedData, pathDecryped_);

    } catch (error) {
      console.error("Error:", error);
    }
  });

