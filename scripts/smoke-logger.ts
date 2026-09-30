import fs from "node:fs";
import path from "node:path";
import {
  DailyAccessLogStream,
  accessLogFileName,
} from "../lib/log-daily-stream";

function main() {
  const logDir = path.join(process.cwd(), "logs", "smoke-test");
  fs.rmSync(logDir, { recursive: true, force: true });

  const stream = new DailyAccessLogStream(logDir);

  stream.on("finish", () => {
    const logFile = path.join(logDir, accessLogFileName(new Date()));
    if (!fs.existsSync(logFile)) {
      console.error("Expected log file missing:", logFile);
      process.exit(1);
    }

    const contents = fs.readFileSync(logFile, "utf8");
    if (!contents.includes("test.smoke")) {
      console.error("Log file does not contain smoke test entry");
      process.exit(1);
    }

    console.log("Daily log stream smoke test passed:", logFile);
  });

  stream.write('{"action":"test.smoke"}\n');
  stream.end();
}

main();
