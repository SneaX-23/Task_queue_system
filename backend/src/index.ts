import express from "express";
import emailRoutes from "./routes/email.routes"
const app = express();
app.use(express.json());

app.use("/email", emailRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});