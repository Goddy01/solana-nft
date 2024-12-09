// Import necessary modules from Metaplex and Solana libraries
import {
    createNft,           // Function to create a new NFT
    fetchDigitalAsset,   // Function to retrieve NFT metadata
    mplTokenMetadata,    // Metaplex token metadata plugin
} from "@metaplex-foundation/mpl-token-metadata";

import {
    airdropIfRequired,  // Helper function to get SOL tokens on devnet
    getExplorerLink,    // Function to generate Solana Explorer links
    getKeypairFromFile, // Function to load user keypair from a file
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"; // Create a Umi instance
import { 
    generateSigner,     // Generate a new key pair
    percentAmount,      // Helper to convert percentage to basis points
    keypairIdentity     // Set identity for Umi instance
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

    // Generate a new signer (key pair) for the collection NFT
    // This will be used to create and identify the collection
    const collectionMint = generateSigner(umi); // umi should use that umi user to sign all our transactions

    // Create the Collection NFT with specified metadata
    const tx = await createNft(umi, {
        mint: collectionMint,       // The generated key pair for the collection NFT
        name: "Tosh's Collection",  // Collection name
        symbol: "TC",               // Collection symbol
        uri: "https://purple-cheap-bobcat-47.mypinata.cloud/ipfs/bafkreihwjnzrooe3goh53roxwecbkn5yiq5kuzqc3ohvf6ny36aun4tt34", // Metadata URI
        sellerFeeBasisPoints: percentAmount(0), // Royalty percentage (0 in this case)
        isCollection: true,         // Explicitly mark this as a collection NFT
    });

    // Send the transaction and wait for confirmation
    await tx.sendAndConfirm(umi);

    // Fetch the newly created collection NFT details
    const createCollectionNft = await fetchDigitalAsset(
        umi,
        collectionMint.publicKey
    );

    // Log the collection NFT's address with a link to Solana Explorer
    console.log(
        `Created Collection 📦! Address is ${getExplorerLink(
            "address",
            createCollectionNft.mint.publicKey,
            "devnet"
        )}`
    );
}

// Run the main function and catch any errors
main().catch(console.error);