import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Sin id" });
    try {
      const d = await redis.get(`nota:${id}`);
      return res.status(200).json(d || {});
    } catch(e) { return res.status(200).json({}); }
  }
  if (req.method === "POST") {
    const { id, texto, fecha } = req.body;
    if (!id || !texto) return res.status(400).json({ error: "Faltan datos" });
    try {
      await redis.set(`nota:${id}`, { texto, fecha }, { ex: 86400 * 7 });
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }
  return res.status(405).end();
}
