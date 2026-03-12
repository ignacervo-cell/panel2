import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Sin ID" });
    const nota = await redis.get(`nota:${id}`);
    if (!nota) return res.status(404).json({ error: "No encontrada" });
    return res.status(200).json({ nota });
  }

  if (req.method === "POST") {
    const { id, texto, fecha } = req.body;
    if (!id || !texto) return res.status(400).json({ error: "Faltan datos" });
    await redis.set(`nota:${id}`, { texto, fecha }, { ex: 60 * 60 * 24 * 30 }); // 30 días
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
