import express from "express"
import cors from "cors"
import gabungRoutes from "./routes/gabung.routes"
import penggunaRoutes from "./routes/pengguna.routes"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => res.json({ ok: true, message: "API NAPINDO OK" }))

app.use("/gabung", gabungRoutes)
app.use("/pengguna", penggunaRoutes)

const PORT = 8080
app.listen(PORT, () => {
  console.log("API berjalan di port", PORT)
})
