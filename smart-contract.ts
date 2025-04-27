import { Blockfrost, Lucid, Data, fromText, Wallet } from "https://deno.land/x/lucid@0.20.9/mod.ts";

const scripts = {
    type: "PlutusV3",
    script: "58af01010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d13232598009808001456600266e1d2000300c375400713371e6eb8c03cc034dd5180798069baa003375c601e601a6ea80222c805a2c8070dd7180700098059baa0068b2012300b001300b300c0013008375400516401830070013003375400f149a26cac80081",
}

const DatumSchema = Data.Object({
    msg: Data.Bytes, // msg là một ByteArray
});

const RedeemerSchema = Data.Object({
    msg: Data.Bytes, // msg là một ByteArray
});

const Datum = () => Data.to({ msg: fromText("Nguyen Van He 32")}, DatumSchema);
export const Redeemer = () => Data.to({ msg: fromText("Nguyen Van He 32")}, RedeemerSchema);

// lock UTxO
export async function lockUtxo(lucid: Lucid, assets: any): Promise<string> {
    const tx = await lucid
        .newTx()
        .payToContract(lucid.newScript(scripts).toAddress(), { Inline: Datum() }, assets)
        .commit();
    
    const signedTx = await tx.sign().commit();   
    const txHash = await signedTx.submit();
    return txHash;
}

// Mở khóa UTxO
export async function unlockUtxo(lucid: Lucid, redeemer: RedeemerSchema): Promise<string> {
    const alwaySuccessScript = lucid.newScript(scripts);

    const utxos = (await lucid.utxosAt(alwaySuccessScript.toAddress())).find((utxo) => 
        !utxo.scriptRef && utxo.datum === redeemer // && utxo.assets.lovelace == lovelace
    );

    if (!utxos) throw new Error("No UTxO found");
    const tx = await lucid
        .newTx()
        .collectFrom([utxos], Redeemer())
        .attachScript(alwaySuccessScript)
        .commit();
    
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();
    return txHash;
}



