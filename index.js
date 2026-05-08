import "dotenv/config"; // 👈 THIS FIXES EVERYTHING
import "./src/config/postgres.js";

import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});