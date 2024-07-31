// Purpose: Constants for the tasks
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
export const CONTRACT_ADDRESS = "0x8b9f8C4726B6f25BA2a5C03f33C4E0BdeA9475cD";
export const RPC_BASE_URL = "https://sepolia.base.org";
export const PRIVATE_KEY_OF_PROTOCOL = process.env.PRIVATE_KEY_OF_PROTOCOL;
export const PRIVATE_KEY_OF_NFT_OWNER = process.env.PRIVATE_KEY_OF_NFT_OWNER;
export const PRIVATE_KEY_DEPLOYER = process.env.PRIVATE_KEY_DEPLOYER;

