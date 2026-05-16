import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import { createCorsOriginMatcher } from "./utils/cors.js";

const app = express();
const corsOriginMatcher = createCorsOriginMatcher(env.allowedOrigin);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://papaya-fox-635911.netlify.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
