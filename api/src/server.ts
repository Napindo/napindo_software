import "dotenv/config"
import express from "express"
import cors from "cors"
import gabungRoutes from "./routes/gabung.routes"
import penggunaRoutes from "./routes/pengguna.routes"
import reportRoutes from "./routes/report.routes"
import prisma from "./prisma"

const app = express()
const API_PREFIX = process.env.API_PREFIX || "/api"
const PORT = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json())

const router = express.Router()

router.get("/", (_req, res) => res.json({ success: true, ok: true, message: "API NAPINDO OK" }))

router.get("/health", async (_req, res) => {
  try {
    const rows = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`
    const now = Array.isArray(rows) && rows[0]?.now ? rows[0].now : new Date()

    return res.json({ success: true, ok: true, data: { serverTime: now } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Healthcheck gagal"
    return res.status(500).json({ success: false, ok: false, message })
  }
})

router.use("/gabung", gabungRoutes)
router.use("/pengguna", penggunaRoutes)
router.use("/report", reportRoutes)

app.use(API_PREFIX, router)

app.listen(PORT, () => {
  console.log(`API berjalan di port ${PORT} dengan prefix ${API_PREFIX}`)
})
