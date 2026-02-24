require("dotenv").config();
const express = require("express");
const SOSContadorClient = require("./sosContadorClient");

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.SOS_PROXY_PORT || process.env.PORT || 5001);
const sosClient = new SOSContadorClient();

function logInfo(message, meta) {
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[API] ${message}${payload}`);
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "sos-proxy", timestamp: new Date().toISOString() });
});

/**
 * GET /sos/asientos
 * Trae asientos desde SOS-Contador.
 * Podés pasar query params, por ejemplo:
 * - /sos/asientos?desde=2026-01-01&hasta=2026-01-31
 */
app.get("/sos/asientos", async (req, res, next) => {
  try {
    const data = await sosClient.getAsientos(req.query || {});
    res.status(200).json({
      ok: true,
      source: "sos-contador",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /sos/asientos
 * Crea un asiento en SOS-Contador.
 * Body JSON se reenvía tal cual al endpoint externo.
 */
app.post("/sos/asientos", async (req, res, next) => {
  try {
    const created = await sosClient.createAsiento(req.body);
    res.status(201).json({
      ok: true,
      source: "sos-contador",
      data: created,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || "Error interno";
  logInfo("Request failed", {
    method: req.method,
    path: req.originalUrl,
    status,
    message,
  });

  res.status(status).json({
    ok: false,
    error: message,
    details: error.details || null,
  });
});

app.listen(PORT, () => {
  logInfo(`Servidor levantado en http://localhost:${PORT}`);
  logInfo("Ejemplos curl:");
  logInfo(`GET  curl "http://localhost:${PORT}/sos/asientos"`);
  logInfo(
    `POST curl -X POST "http://localhost:${PORT}/sos/asientos" -H "Content-Type: application/json" -d '{"fecha":"2026-02-23","detalle":"Asiento de prueba"}'`,
  );
});
