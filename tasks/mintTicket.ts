import { task } from "hardhat/config";
import { ethers } from "ethers";
import dotenv from "dotenv";
import EthCrypto from "eth-crypto";
import {
  CONTRACT_ADDRESS, RPC_BASE_URL, PRIVATE_KEY_OF_PROTOCOL, PRIVATE_KEY_DEPLOYER
} from "./CONSTANTS";

dotenv.config();

const privateKeyProtocol = PRIVATE_KEY_DEPLOYER;

if (!privateKeyProtocol) {
  throw new Error("Missing private key");
}

task("mint-ticket-and-encrypt-qr", "Mint a ticket and encrypt the image with the public key of the protocol")
  .addParam("imagePath", "The path to the image file")
  .addParam("address", "The address of the nft owner")
  .addParam("fileName", "The file name")
  .setAction(async (taskArgs, hre) => {
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKeyProtocol);

    //       struct TicketInfo {
    //       TicketStatus status;
    //       string ticketDescription;
    //       string ticketMeta1;
    //       string ticketMeta2;
    //       uint32 eventIndex;
    //       uint64 externalTokenId;
    //       uint64 eventRoundId;
    //       uint64 ticketPrice;
    //   }

    //   function returnTicketInfo(
    //     uint256 tokenId
    //   ) public view returns(TicketInfo memory) {
    //   return ticketInfoStorage[tokenId];
    // }

    // function mintConditionalTicketSimple(address to, string memory encryptedPre, uint256 eventIndex) external;

    const provider = new ethers.JsonRpcProvider(RPC_BASE_URL);

    const wallet = new ethers.Wallet(privateKeyProtocol, provider);

    const abi = [
      "function mintConditionalTicketSimple(address to, string memory encryptedPre, uint256 eventIndex) external"
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    try {
      const filePath = taskArgs.imagePath;
      const providerUrl = RPC_BASE_URL;
      const tokenId = taskArgs.tokenId;
      const fileName = taskArgs.fileName;
      const nftOwnerPublicKey = taskArgs.nftOwnerPublicKey;

      const ticketInfo = await contract.returnTicketInfo(tokenId);
      console.log("ticketInfo", ticketInfo);

      // Fetch the ticketInfo hash from IPFS
      const ticketInfoHash = ticketInfo.ticketMeta1; // Assuming ticketMeta1 contains the IPFS hash
      console.log("ticketInfoHash", ticketInfoHash);
      const ticketInfoData = await fetchFromIPFS(ticketInfoHash);
      console.log("Fetched ticketInfo data from IPFS:", ticketInfoData.toString());

      const decryptedData = await decryptData(ticketInfoData.toString(), privateKey);
      console.log("decryptedData", decryptedData);

      // Construct the output path
      const outputPath = `./files/qrcode${tokenId}.png`;




      const imageData = readImage(filePath);
      const base64ImageData = convertImageToBase64(imageData);
      const encryptedData = await encryptData(base64ImageData, publicKey);

      const signedUrl = await getSignedUrlForUpload(fileName, "image/png");
      console.log("signedUrl", signedUrl);
      await uploadToS3(signedUrl, Buffer.from(encryptedData));

      // const ipfsCid = await pinToIPFS(Buffer.from(encryptedData));
      // console.log("ipfsCid", ipfsCid);

      // await redeemTicket(tokenId, ipfsCid, providerUrl, privateKey);
    } catch (error) {
      console.error("Error:", error);
    }
  });

