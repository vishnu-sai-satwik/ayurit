import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { initSocket } from "./socket/index.js";

// NOTE: this file may be edited to trigger automatic restart when env changes during development

const bootstrap = async () => {
  await connectDb();

  const server = http.createServer(app);
  initSocket(server, env.allowedOrigin);

  let listenPort = env.port;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await new Promise((resolve, reject) => {
        const handleError = (error) => {
          server.off("listening", handleListening);
          reject(error);
        };

        const handleListening = () => {
          server.off("error", handleError);
          resolve();
        };

        server.once("error", handleError);
        server.once("listening", handleListening);
        server.listen(listenPort);
      });

      console.log(`Ayurit backend running on port ${listenPort}`);
      return;
    } catch (error) {
      if (error.code !== "EADDRINUSE") {
        throw error;
      }

      console.warn(`[server] Port ${listenPort} is in use, trying ${listenPort + 1}`);
      listenPort += 1;
    }
  }

  throw new Error(`Unable to start backend from port ${env.port}`);
};

bootstrap().catch((err) => {
  console.error("Failed to bootstrap backend", err);
  process.exit(1);
});


// Before continuing further development, verify the complete MongoDB backend integration.

// Tasks:

// 1. Check whether MongoDB is properly connected using Mongoose.
// 2. Verify .env configuration and database URI handling.
// 3. Ensure backend creates collections correctly after signup/login.
// 4. Verify all schemas/models:

//    * User
//    * Patient
//    * Doctor
//    * Admin
//    * Diet Plans
//    * Appointments
// 5. Ensure CRUD operations are working properly.
// 6. Add proper database connection logs.
// 7. Add error handling for failed DB connections.
// 8. Remove duplicate or unused schemas/models.
// 9. Ensure all dashboards fetch real MongoDB data correctly.
// 10. Verify database persistence after server restart.

// After verification:

// * Explain current database structure
// * Explain which collections are active
// * Explain what is missing
// * Confirm whether backend is fully connected to MongoDB or not
