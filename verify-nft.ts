// Import necessary modules from Metaplex and Solana libraries
import {
    findMetadataPda,    // Function to find the Program Derived Address (PDA) for NFT metadata
    mplTokenMetadata,   // Metaplex token metadata plugin
    verifyCollectionV1, // Function to verify an NFT belongs to a specific collection
} from "@metaplex-foundation/mpl-token-metadata";

import {
    airdropIfRequired,  // Helper function to get SOL tokens on devnet
    getExplorerLink,    // Function to generate Solana Explorer links
    getKeypairFromFile, // Function to load user keypair from a file
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"; // Create a Umi instance

import {
    keypairIdentity,    // Set identity for Umi instance
    publicKey           // Convert string to public key
} from "@metaplex-foundation/umi";

import {
    clusterApiUrl,  // Get RPC URL for a specific Solana network
    Connection,     // Solana network connection
    LAMPORTS_PER_SOL // Conversion constant for SOL to lamports
} from "@solana/web3.js";

async function main() {
    // Establish a connection to the Solana devnet
    const conn = new Connection(clusterApiUrl("devnet")); // get conn from devnet

    // Load user's keypair from a local file (typically a JSON file)
    const user = await getKeypairFromFile(); // get id from json

    // Ensure the user has enough SOL for transactions
    // Airdrop 1 SOL if balance is below 0.5 SOL
    await airdropIfRequired(
        conn,
        user.publicKey,
        1 * LAMPORTS_PER_SOL,      // Amount to airdrop
        0.5 * LAMPORTS_PER_SOL     // Minimum balance threshold
    );

    // Log the user's public key for verification
    console.log("Loaded user: ", user.publicKey.toBase58());

    // Create a Umi instance connected to the Solana RPC endpoint
    const umi = createUmi(conn.rpcEndpoint);
   
    // Add Metaplex token metadata plugin to Umi
    umi.use(mplTokenMetadata());

    // Convert the user's keypair to a Umi-compatible format
    const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
   
    // Set the user as the identity for signing transactions
    umi.use(keypairIdentity(umiUser));
    console.log("Set up Umi instance for user");

    // Specify the collection address for the NFT
    // This is the public key of the collection NFT
    const collectionAddress = publicKey("H9an4eoe4qvHN8prpptrxrUtVadWRJ2SfTCznXqWNwVi");
    console.log("Creating NFT...");

    // Specify the address of the NFT to be verified in the collection
    const nftAddress = publicKey("EhVJLzqXnyypn95ZFL8QKVFSntRehk85JAQhcgAG9fwS")
   
    // Create a transaction to verify the NFT as a member of the specified collection
    const tx = await verifyCollectionV1(umi, {
        metadata: findMetadataPda(umi, {mint: nftAddress}), // Find the metadata PDA for the NFT
        collectionMint: collectionAddress, // The collection's mint address
        authority: umi.identity, // The authority performing the verification (current user)
    });

    // Send and confirm the verification transaction
    tx.sendAndConfirm(umi);

    // Log a confirmation message with links to explorer for verification details
    console.log(`NFT ${nftAddress} verified as member of ${collectionAddress}! See more details @ ${getExplorerLink("address", nftAddress, "devnet")} `);
}

// Run the main function and catch any errors
main().catch(console.error);