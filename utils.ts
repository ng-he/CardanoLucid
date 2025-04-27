import { Lucid, Wallet, Addresses, fromText, ScriptUtility, Data } from "https://deno.land/x/lucid@0.20.9/mod.ts";

export async function getBalance(wallet: Wallet) {
    const utxos = await wallet.getUtxos();

    let totalLovelace = 0n;
    for (const utxo of utxos) {
        totalLovelace += utxo.assets.lovelace ?? 0n;
    }

    return totalLovelace;
}

export async function createMintingscripts(lucid: Lucid) {
    const { payment } = Addresses.inspect(await lucid.wallet.address()); 
    const mintingScripts = lucid.newScript(
        {
            type: "All",
            scripts: [
                { type: "Sig", keyHash: payment.hash }
            ],
        },
    );
    
    return mintingScripts;
}

export async function mintToken(lucid: Lucid, mintingScripts: ScriptUtility<Data[]>, tokenName: string, amount: bigint) {
    const policyId = mintingScripts.toHash();
    const unit = policyId + fromText(tokenName)
    const metadata = {
        [policyId]: {
            [tokenName]: {
                "name": `${tokenName}`
            }
        }
    }

    console.log(metadata);
    const tx = await lucid.newTx()
        .mint({ [unit]: amount })
        .attachScript(mintingScripts)
        .attachMetadata(721, metadata)
        .commit();

    return {tx, unit};
}

export async function burnToken(lucid: Lucid, mintingScripts: ScriptUtility<Data[]>, tokenName: string, amount: bigint) {
    const policyId = mintingScripts.toHash();
    const unit = policyId + fromText(tokenName);
    
    const tx = await lucid.newTx()
        .mint({ [unit]: -amount })
        .attachScript(mintingScripts)
        .commit();
    
    return {tx, unit};
}