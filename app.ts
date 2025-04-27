import "https://deno.land/std@0.203.0/dotenv/load.ts";
import { Blockfrost, Lucid } from "https://deno.land/x/lucid@0.20.9/mod.ts";
import { getBalance, createMintingscripts, mintToken, burnToken } from "./utils.ts";
import { lockUtxo, unlockUtxo, Redeemer } from "./smart-contract.ts";
import process from "node:process";

// Blockfrost
const lucid = new Lucid({
  provider: new Blockfrost(
    "https://cardano-preview.blockfrost.io/api/v0",
    "previewQs7OSQTV7YVu8EuF7JrCiu42jpiFKVF3",
  ),
});

async function mint_500_BK0332_tokens() {
    const mintingScripts = await createMintingscripts(lucid); 

    // Mint
    const {tx, unit} = await mintToken(lucid, mintingScripts, "BK03:32", 500n);
    const signedtx = await tx.sign().commit();
    const txHash = await signedtx.submit();
    console.log(`Bạn có thể kiểm tra giao dịch tại: https://preview.cexplorer.io/tx/${txHash}`); 
    return {txHash, unit};
}

async function burn_500_BK0332_tokens() {
    const mintingScripts = await createMintingscripts(lucid);

    // Burn
    const {tx, unit} = await burnToken(lucid, mintingScripts, "BK03:32", 500n);
    const signedtx = await tx.sign().commit();
    const txHash = await signedtx.submit();
    console.log(`Bạn có thể kiểm tra giao dịch tại: https://preview.cexplorer.io/tx/${txHash}`); 
    return {txHash, unit};
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const delayTime = 180;

  try {
    const result = await mint_500_BK0332_tokens();
    console.log(`✅ Minting thành công! Xem giao dịch: https://preview.cexplorer.io/tx/${result.txHash}`);
    console.log("🕒 Bắt đầu đếm ngược khóa 50 lovelace và 500 token ...");

    for (let i = delayTime; i >= 1; i--) {
      process.stdout.write(`\r⏳ Còn ${i}s... `); // Ghi đè cùng 1 dòng
      await delay(1000);
    }
    console.log("\n🚀 Bắt đầu khóa!");

    const lockResult = await lockUtxo(lucid, { lovelace: 50_000_000n, [result.unit]: 500n });
    console.log(`✅ Lock UTxO thành công! Xem giao dịch: https://preview.cexplorer.io/tx/${lockResult}`);
    console.log("🕒 Bắt đầu đếm ngược mở khóa...");

    for (let i = delayTime; i >= 1; i--) {
      process.stdout.write(`\r⏳ Còn ${i}s... `); // Ghi đè cùng 1 dòng
      await delay(1000);
    }
    console.log("\n🚀 Bắt đầu mở khóa!");

    const unlockResult = await unlockUtxo(lucid, Redeemer());
    console.log(`✅ Unlock UTxO thành công! Xem giao dịch: https://preview.cexplorer.io/tx/${unlockResult}`);
    
  } catch (error) {
    console.error("❌ Lỗi:", error);
  }
}

// 1. Kết nối ví Cardano dùng seed phase.
const seed = Deno.env.get("SEED_PHRASE") ?? "";
lucid.selectWalletFromSeed(seed, { addressType: "Base", index: 0 })

// 2. Xem thông tin ví: Hiển thị địa chỉ ví hiện tại và tổng số dư ADA trong ví.
const address = await lucid.wallet.address()
const balance = await getBalance(lucid.wallet)

console.log('\n')
console.log('Thông tin ví:')
console.log(` - Đ/c ví gửi: ${address}`)
console.log(` - Số dư ví: ${balance} lovelace`)


console.log('\n')

// Chạy app
main()

// burn_500_BK0332_tokens()
//   .then(() => {
//     console.log("Burning thành công!");
//   })
//   .catch((error) => {
//     console.error("Lỗi trong quá trình burning:", error);
//   });

// console.log(await lucid.wallet.getUtxos())





