// Purpose: Constants for the tasks
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
export const CONTRACT_ADDRESS = "0x1cDc1E1F0D8fa4191C7f844316d6a043d02cFEB4";
export const RPC_BASE_URL = "https://sepolia.base.org";
export const PRIVATE_KEY_OF_PROTOCOL = process.env.PRIVATE_KEY_OF_PROTOCOL;
export const PRIVATE_KEY_OF_NFT_OWNER = process.env.PRIVATE_KEY_OF_NFT_OWNER;
export const PRIVATE_KEY_DEPLOYER = process.env.PRIVATE_KEY_DEPLOYER;

