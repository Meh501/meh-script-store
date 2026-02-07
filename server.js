const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
// هذا السطر يخلي السيرفر يشوف كل ملفات الـ HTML والصور تلقائياً
app.use(express.static(path.join(__dirname)));
app.use(express.json());

let db;

(async () => {
    try {
        // فتح قاعدة البيانات في مسار السيرفر
        db = await open({ filename: path.join(__dirname, 'database.db'), driver: sqlite3.Database });
        await db.exec(`CREATE TABLE IF NOT EXISTS users (username TEXT UNIQUE, password TEXT, created_at TEXT)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS codes (code TEXT UNIQUE, status TEXT DEFAULT 'active')`);
        await db.exec(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, comment TEXT)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, item_name TEXT, download_link TEXT, date TEXT)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS updates (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, date TEXT)`);

        const codesList = ["HXLY927364", "MOPQ102938", "BVRC883746", "ZWTS556271", "KFND901827", "LJHG334455", "PQWO778899", "ZMXN112233", "ALSK445566", "DHFG990011", "RQWS672839", "PLMN543210", "XCVB098765", "OKIJ123450", "UHBV765432", "YGCF876543", "TRED234567", "WSXZ567890", "EDCV345678", "RFVT456789", "TGBY567801", "YHNU678912", "UJMI789023", "IKOL890134", "OLPM901245", "QAZW111222", "SXED333444", "CRFV555666", "TGBC777888", "YHNB999000", "UJMK121212", "IKLO343434", "PLMZ565656", "QWNS787878", "ASDF909090", "ZXCV123123", "QWER456456", "TYUI789789", "OPKL012012", "MNBV345345", "LKJH678678", "HGFD901901", "DSXZ234234", "POIU567567", "YTRE890890", "NBVC123412", "MNKJ567856", "BVCX901290", "XDSW345634", "ASQW789078", "GRTY102030", "VBGH405060", "NJMK708090", "PLKO112233", "ZAQX445566", "XSWD778899", "CDEV001122", "VFRB334455", "BGTN667788", "NHYM990011", "MJUK223344", "KILO556677", "LOPQ889900", "WAZX123456", "ESDC789012", "RDVF345678", "TGBN901234", "YHJM567890", "UJMK123456", "IKLO789012", "PLMZ345678", "QWNS901234", "ASDF567890", "ZXCV123456", "QWER789012", "TYUI345678", "OPKL901234", "MNBV567890", "LKJH123456", "HGFD789012", "DSXZ345678", "POIU901234", "YTRE567890", "NBVC123456", "MNKJ789012", "BVCX345678", "XDSW901234", "ASQW567890", "GRTY123456", "VBGH789012", "NJMK345678", "PLKO901234", "ZAQX567890", "XSWD123456", "CDEV789012", "VFRB345678", "BGTN901234", "NHYM567890", "MJUK123456", "KILO789012"];
        for (const c of codesList) { await db.run(`INSERT OR IGNORE INTO codes (code) VALUES (?)`, [c]); }
        console.log("✅ سيرفر المالك Meh جاهز للعمل العالمي!");
    } catch (err) { console.error("❌ خطأ في قاعدة البيانات:", err); }
})();

// --- توجيه المسارات الرئيسية لضمان عدم حدوث Not Found ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/activate', (req, res) => res.sendFile(path.join(__dirname, 'activate.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin_codes', (req, res) => res.sendFile(path.join(__dirname, 'admin_codes.html')));
app.get('/reviews', (req, res) => res.sendFile(path.join(__dirname, 'reviews.html')));

// --- العمليات (APIs) ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || username.length < 3 || password.length < 8) return res.json({ success: false, message: "⚠️ البيانات غير مستوفية للشروط" });
    try {
        await db.run('INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)', [username, password, new Date().toLocaleString('ar-EG')]);
        res.json({ success: true, message: "تم التسجيل بنجاح!" });
    } catch (e) { res.json({ success: false, message: "اليوزر محجوز!" }); }
});

app.post('/login', async (req, res) => {
    const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', [req.body.username, req.body.password]);
    if (user) res.json({ success: true }); else res.json({ success: false, message: "خطأ في البيانات" });
});

app.post('/admin/get-all-codes', async (req, res) => {
    if(req.body.adminUser !== 'Meh') return res.json([]);
    res.json(await db.all('SELECT * FROM codes'));
});

app.post('/activate', async (req, res) => {
    const found = await db.get('SELECT * FROM codes WHERE code = ? AND status = "active"', [req.body.code]);
    if (found) {
        const link = "https://cdn.discordapp.com/attachments/1033810771823566918/1469681761071005756/steam_.rar?ex=69888b4d&is=698739cd&hm=12040a17f6df560d6ac4287660808a303180cde14ebf5c2e79f04d13c8161203&";
        await db.run('UPDATE codes SET status = "used" WHERE code = ?', [req.body.code]);
        await db.run('INSERT INTO orders (username, item_name, download_link, date) VALUES (?, ?, ?, ?)', [req.body.username, "سكربت Steam المطور", link, new Date().toLocaleString('ar-EG')]);
        res.json({ success: true, link: link });
    } else res.json({ success: false, message: "كود خاطئ أو مستخدم!" });
});

app.post('/get-my-orders', async (req, res) => { res.json(await db.all('SELECT * FROM orders WHERE username = ? ORDER BY id DESC', [req.body.username])); });
app.get('/get-updates', async (req, res) => { res.json(await db.all('SELECT * FROM updates ORDER BY id DESC')); });
app.post('/add-update', async (req, res) => {
    if(req.body.user !== 'Meh') return res.json({ success: false });
    await db.run('INSERT INTO updates (content, date) VALUES (?, ?)', [req.body.content, new Date().toLocaleString('ar-EG')]);
    res.json({ success: true });
});
app.get('/get-reviews', async (req, res) => { res.json(await db.all('SELECT * FROM reviews ORDER BY id DESC')); });
app.post('/add-review', async (req, res) => { await db.run('INSERT INTO reviews (user, comment) VALUES (?, ?)', [req.body.user, req.body.comment]); res.json({ success: true }); });
app.post('/delete-review', async (req, res) => {
    if(req.body.adminUser !== 'Meh') return res.json({ success: false });
    await db.run('DELETE FROM reviews WHERE id = ?', [req.body.id]);
    res.json({ success: true });
});
app.post('/admin/get-users', async (req, res) => {
    if(req.body.adminUser !== 'Meh') return res.json([]);
    res.json(await db.all('SELECT username, password, created_at FROM users'));
});
app.post('/admin/change-pass', async (req, res) => {
    if(req.body.adminUser !== 'Meh') return res.json({ success: false });
    await db.run('UPDATE users SET password = ? WHERE username = ?', [req.body.newPass, req.body.targetUser]);
    res.json({ success: true });
});

// إعداد البورت الخاص بـ Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على بورت ${PORT}`));
