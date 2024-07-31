import { ethers } from "ethers";
import fs from "fs";
import EthCrypto from "eth-crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from "axios";
import { CONTRACT_ADDRESS, PUBLIC_KEY_0XCC, PRIVATE_KEY_0XCC } from "./CONSTANTS";


// Initialize S3
const s3Client = new S3Client({
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.FB_ACCESS_KEY_ID,
    secretAccessKey: process.env.FB_SECRET_ACCESS_KEY,
  },
});


const publicKey = EthCrypto.publicKeyByPrivateKey(PRIVATE_KEY_0XCC);
console.log("Public Key:", publicKey);

// Function to read the PNG file
export const readImage = (filePath: string): Buffer => {
  return fs.readFileSync(filePath);
};

// Function to convert the image data to a base64 string
export const convertImageToBase64 = (imageData: Buffer): string => {
  return imageData.toString('base64');
};


// Function to encrypt the image data
export const encryptData = async (data: string, publicKey: string): Promise<string> => {
  const encrypted = await EthCrypto.encryptWithPublicKey(publicKey, data);
  return EthCrypto.cipher.stringify(encrypted);
};

// Function to get a signed URL for uploading to S3
export const getSignedUrlForUpload = async (keyName: string, fileType: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: "rest",
    Key: keyName,
    ContentType: fileType,
    Metadata: {
      import: 'car',
    },
  });

  return getSignedUrl(s3Client, command, { expiresIn: 60 });
};


// Function to upload encrypted data to S3 via the signed URL
export const uploadToS3 = async (signedUrl: string, data: Buffer): Promise<void> => {
  const response = await axios.put(signedUrl, data, {
    headers: {
      'Content-Type': 'image/png',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to upload to S3: ${response.statusText}`);
  }

  console.log("File uploaded successfully.");
};

// Function to pin data to IPFS using Filebase
export const pinToIPFS = async (data: Buffer): Promise<string> => {
  const apiKey = process.env.FB_API_KEY;
  const response = await axios.post("https://api.filebase.io/v1/ipfs", {
    file: data.toString('base64'),
    // Include any other required metadata here
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${apiKey}`, // Make sure to set your API key here
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to pin to IPFS: ${response.statusText}`);
  }

  console.log("Pinned to IPFS. CID:", response.data.cid);
  return response.data.cid;
};

// Function to call the smart contract
export const redeemTicket = async (tokenId: number, ipfsPath: string, providerUrl: string, privateKey: string) => {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  if (!PRIVATE_KEY_0XCC) {
    throw new Error("Private key is undefined");
  }

  const wallet = new ethers.Wallet(PRIVATE_KEY_0XCC, provider)
  const abi = [
    "function redeemConditionalTicket(uint256 tokenId, string memory encryptedPost) external",
  ];
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  const tx = await contract.redeemConditionalTicket(tokenId, ipfsPath);
  await tx.wait();
  console.log("Transaction successful:", tx.hash);
};

// Main function
// (async () => {
//   try {
//     // Define file path and other variables
//     const filePath = "./SDEDSMALLER.png";
//     const providerUrl = "https://sepolia.base.org";
//     const privateKey = process.env.PK_0XCC;
//     const tokenId = 1;

//     // Read and encrypt the image
//     const imageData = readImage(filePath);
//     const base64ImageData = convertImageToBase64(imageData);
//     const encryptedData = await encryptData(base64ImageData, publicKey);

//     // Get signed URL and upload encrypted data to S3
//     const signedUrl = await getSignedUrlForUpload("SDEDSMALLER.png", "image/png");
//     await uploadToS3(signedUrl, Buffer.from(encryptedData));

//     // Pin encrypted data to IPFS using Filebase
//     const ipfsCid = await pinToIPFS(Buffer.from(encryptedData));

//     // Call the smart contract function
//     // await redeemTicket(tokenId, ipfsCid, providerUrl, privateKey);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();
