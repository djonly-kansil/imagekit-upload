import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const app = !global._firebaseApp
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    })
  : global._firebaseApp;

global._firebaseApp = app;

const db = getFirestore(app);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Hanya menerima POST" });

  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID tidak ditemukan" });

  try {
    const user = await getAuth().getUser(uid);

    // Cek jika email belum diverifikasi
    if (!user.emailVerified) {
      // Ambil dokumen dari Firestore pendingUsers
      const pendingRef = db.collection("pendingUsers").doc(uid);
      const docSnap = await pendingRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(0);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;

        // Jika lebih dari 5 menit sejak pendaftaran dan belum verifikasi
        if (diffMinutes > 5) {
          await getAuth().deleteUser(uid);
          await pendingRef.delete(); // bersihkan data Firestore juga
          return res.status(200).json({
            success: true,
            message: "User belum verifikasi setelah 5 menit. Akun dihapus.",
            uid,
          });
        } else {
          return res.status(200).json({
            message:
              "User belum verifikasi, tetapi masih dalam batas waktu.",
            timeRemaining: `${Math.ceil(5 - diffMinutes)} menit`,
          });
        }
      } else {
        return res.status(404).json({
          error: "Data pendingUsers tidak ditemukan",
        });
      }
    }

    // Email sudah diverifikasi
    return res.status(200).json({ message: "User sudah diverifikasi. Tidak dihapus." });
  } catch (err) {
    console.error("Gagal proses:", err);
    return res.status(500).json({ error: "Terjadi kesalahan saat memproses user." });
  }
}