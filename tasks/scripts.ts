import { ethers } from "ethers";
import fs from "fs";
import EthCrypto from "eth-crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from "axios";
import { CONTRACT_ADDRESS, PRIVATE_KEY_OF_PROTOCOL } from "./CONSTANTS";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const accessKeyId = process.env.FB_ACCESS_KEY_ID;
const secretAccessKey = process.env.FB_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error("Missing S3 credentials");
}

// Initialize S3
const s3Client = new S3Client({
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

const privateKey = process.env.PK_0XCC;
const publicAddress = process.env.PUBLIC_OXCC;

if (!privateKey) {
  throw new Error("Missing private key");
}
if (!publicAddress) {
  throw new Error("Missing public key");
}

// Get the public key from the private key - note that public key is different from public address
const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
console.log("Public Key of address: %s is %s", publicAddress, publicKey);

// Function to read the PNG file
export const readImage = (filePath: string): Buffer => {
  return fs.readFileSync(filePath);
};

// Function to convert the image data to a base64 string
export const convertImageToBase64 = (imageData: Buffer): string => {
  return imageData.toString('base64');
};

export const saveDecryptedFile = (data: string, filePath: string): void => {
  const buffer = Buffer.from(data, 'base64');
  fs.writeFileSync(filePath, buffer);
  console.log(`File saved to ${filePath}`);
};

// Function to encrypt the image data
export const encryptData = async (data: string, publicKey: string): Promise<string> => {
  const encrypted = await EthCrypto.encryptWithPublicKey(publicKey, data);
  return EthCrypto.cipher.stringify(encrypted);
};

export const decryptData = async (encryptedData: string, privateKey: string): Promise<string> => {
  const encryptedObject = EthCrypto.cipher.parse(encryptedData);
  const decrypted = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedObject);
  return decrypted;
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

export const fetchFromIPFS = async (cid: string): Promise<Buffer> => {
  const ipfsGatewayUrl = `https://ipfs.io/ipfs/${cid}`;
  const response = await axios.get(ipfsGatewayUrl, { responseType: 'arraybuffer' });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }

  return Buffer.from(response.data);
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

  if (!PRIVATE_KEY_OF_PROTOCOL) {
    throw new Error("Private key is undefined");
  }

  const wallet = new ethers.Wallet(PRIVATE_KEY_OF_PROTOCOL, provider)

  const abi = [
    "function redeemConditionalTicket(uint256 tokenId, string memory encryptedPost) external",
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  const tx = await contract.redeemConditionalTicket(tokenId, ipfsPath);
  await tx.wait();
  console.log("Transaction successful:", tx.hash);
};
