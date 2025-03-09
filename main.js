const fs = require('fs');
const axios = require('axios');

const API_BASE = "https://api.furmula.games/api";
const INTERVAL_TIME = 60 * 60 * 1000;

function readAddressesFromFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf-8');
        return data.split('\n').map(addr => addr.trim()).filter(addr => addr.length > 0);
    } catch (error) {
        console.error(`❌ Gagal membaca file ${filename}:`, error.message);
        return [];
    }
}

async function getTasks(address) {
    try {
        const response = await axios.get(`${API_BASE}/day-tasks/${address}`);
        return response.data.data;
    } catch (error) {
        console.error(`❌ [${address}] Gagal mengambil task:`, error.response?.data?.error || error.message);
        return [];
    }
}

async function completeTask(address, task) {
    try {
        await axios.post(`${API_BASE}/tasks/complete`, { taskId: task.id.toString(), address });
        console.log(`✅ [${address}] Task "${task.title}" berhasil diselesaikan!`);
    } catch (error) {
        console.error(`❌ [${address}] Gagal menyelesaikan task "${task.title}":`, error.response?.data?.error || error.message);
    }
}

async function claimReward(address) {
    try {
        const response = await axios.get(`${API_BASE}/claim-reward/${address}`);
        console.log(`✅ [${address}] Sukses Check-In: claimDay ${response.data?.data?.claimDay || 'Unknown'}`);
    } catch (error) {
        console.error(`❌ [${address}] Gagal Check-In: ${error.response?.data?.error || error.message}`);
    }
}

async function updateLevel(address, levelType) {
    try {
        await axios.post(`${API_BASE}/update-level`, { address, levelType });
        console.log(`✅ [${address}] Berhasil upgrade level: ${levelType}`);
    } catch (error) {
        console.error(`❌ [${address}] Gagal upgrade level "${levelType}" (${error.response?.data?.error || error.message})`);
    }
}

async function getUserInfo(address) {
    try {
        const response = await axios.get(`${API_BASE}/user-info/${address}`);
        return response.data;
    } catch (error) {
        console.error(`❌ [${address}] Gagal mengambil user info:`, error.response?.data?.error || error.message);
        return null;
    }
}

async function runBot() {
    console.log("\n🚀 Menjalankan bot Furmula untuk banyak address...\n");

    const addresses = readAddressesFromFile('address.txt');
    if (addresses.length === 0) {
        console.error("❌ Tidak ada address yang ditemukan di address.txt");
        return;
    }

    for (const address of addresses) {
        console.log(`🔹 Memproses address: ${address}\n`);

        console.log(`📌 [${address}] Mengecek dan menyelesaikan task...`);
        const tasks = await getTasks(address);
        if (tasks.length === 0) {
            console.log(`✅ [${address}] Semua task sudah selesai!\n`);
        } else {
            for (const task of tasks) {
                if (!task.completed) {
                    await completeTask(address, task);
                }
            }
        }

        console.log(`🎁 [${address}] Melakukan check-in harian...`);
        await claimReward(address);

        console.log(`🚀 [${address}] Mencoba upgrade level...`);
        const levelTypes = ["racer_level", "bolid_level", "manager_level", "sponsor_level"];
        for (const levelType of levelTypes) {
            await updateLevel(address, levelType);
        }

        console.log(`ℹ️ [${address}] Mengambil user info terbaru...`);
        const userInfo = await getUserInfo(address);
        if (userInfo) {
            console.log(`\n===== 📊 USER INFO (${address}) =====`);
            console.log(`🏎️ Racer Level      : ${userInfo.data?.racerLevel || 0} (${userInfo.data?.racerTitle || "Unknown"})`);
            console.log(`🚗 Bolid Level      : ${userInfo.data?.bolidLevel || 0}`);
            console.log(`👨‍💼 Manager Level   : ${userInfo.data?.managerLevel || 0}`);
            console.log(`💰 Sponsor Level    : ${userInfo.data?.sponsorLevel || 0}`);
            console.log(`💸 Total Earned     : ${userInfo.data?.totalEarnedTokens || 0} tokens`);
            console.log(`🔄 Current Tokens   : ${userInfo.data?.currentTokens || 0}`);
            console.log(`⏳ Tokens Per Hour  : ${userInfo.data?.tokensPerHour || 0}`);
            console.log(`🎯 Referral Points  : ${userInfo.data?.referralPoints || 0}`);
            console.log(`👥 Referral Count   : ${userInfo.data?.referralCount || 0}`);
            console.log(`🆔 Referral Code    : ${userInfo.data?.referralCode || "-"}`);
            console.log(`=======================================================================\n`);
        }
    }

    console.log("✅ Semua address telah diproses!");

    startCountdown(INTERVAL_TIME / 1000);
}

function startCountdown(seconds) {
    let remainingTime = seconds;
    const interval = setInterval(() => {
        process.stdout.write(`\r⏳ Menunggu: ${formatTime(remainingTime)} `);
        remainingTime--;

        if (remainingTime < 0) {
            clearInterval(interval);
            console.log("\n🔄 Memulai proses berikutnya...\n");
        }
    }, 1000);
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs} jam ` : ""}${mins > 0 ? `${mins} menit ` : ""}${secs} detik`;
}

runBot();

setInterval(runBot, INTERVAL_TIME);
