const { Keypair } = require('@solana/web3.js');
const { mnemonicToSeedSync, generateMnemonic } = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const fs = require('fs');
const axios = require('axios');

// Ambil argumen dari command line
const args = process.argv.slice(2);
const referralCode = args[0];
const referralCount = parseInt(args[1], 10);

// Validasi input
if (!referralCode || isNaN(referralCount) || referralCount <= 0) {
    console.log("❌ Penggunaan yang benar: node reff.js <kode_referal> <jumlah>");
    process.exit(1);
}

// 1. Generate Wallet Phantom Baru dengan Seed Phrase
function generatePhantomWallet() {
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);

    const publicKey = keypair.publicKey.toBase58();
    const privateKey = Buffer.from(keypair.secretKey).toString('hex');

    console.log(`\n🔹 Wallet Baru Dibuat:`);
    console.log(`📌 Public Key : ${publicKey}`);
    console.log(`🔑 Private Key: ${privateKey}`);
    console.log(`📝 Seed Phrase: ${mnemonic}`);

    // Simpan hanya public key ke address.txt
    fs.appendFileSync('address.txt', `${publicKey}\n`);

    return publicKey;
}

// 2. Auto Submit Referral
async function submitReferral(referralCode, count) {
    console.log(`\n🚀 Memulai ${count} proses referral dengan kode: ${referralCode}...\n`);

    for (let i = 1; i <= count; i++) {
        console.log(`📢 Proses Referral ke-${i}...`);
        const walletAddress = generatePhantomWallet();
        const referralURL = `https://api.furmula.games/api/user-info/${walletAddress}?code=${referralCode}`;

        try {
            const response = await axios.get(referralURL);
            console.log(`✅ Referral Berhasil: ${walletAddress}`);
            console.log(`📝 Response:`, JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error(`❌ Gagal Referral ${i}:`, error.response ? error.response.data : error.message);
        }

        console.log('---------------------------------------');
    }

    console.log("\n✅ Semua proses referral selesai!");
}

// Jalankan fungsi dengan input dari command line
submitReferral(referralCode, referralCount);
