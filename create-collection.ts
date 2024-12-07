import {
    createNft,
    fetchDigitalAsset,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
    airdropIfRequired,
    getExplorer,
    getKeypairFromFile
} from "@solana-developers/helpers"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

const conn = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile();

await airdropIfRequired(
    conn,
    user.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL
);

console.log("Loaded user: ", user.publicKey.toBase58());

const umi = createUmi(conn.rpcEndpoint);