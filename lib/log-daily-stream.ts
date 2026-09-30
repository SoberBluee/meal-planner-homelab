import fs from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";
import SonicBoom from "sonic-boom";

export function accessLogFileName(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `access-${y}-${m}-${d}.log`;
}

export function getLogDir(): string {
  return process.env.LOG_DIR || "/var/log/mealplanner";
}

export class DailyAccessLogStream extends Writable {
  private currentDateKey = "";
  private fileStream: SonicBoom | null = null;

  constructor(private readonly logDir: string) {
    super();
    fs.mkdirSync(logDir, { recursive: true });
  }

  private dateKey(date: Date): string {
    return accessLogFileName(date).replace("access-", "").replace(".log", "");
  }

  private openForDate(date: Date): void {
    const key = this.dateKey(date);
    if (key === this.currentDateKey && this.fileStream) {
      return;
    }

    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }

    const filePath = path.join(this.logDir, accessLogFileName(date));
    this.fileStream = new SonicBoom({
      dest: filePath,
      append: true,
      sync: true,
      mkdir: true,
    });
    this.currentDateKey = key;
  }

  _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    try {
      this.openForDate(new Date());
      const stream = this.fileStream;
      if (!stream) {
        callback(new Error("Log file stream not available"));
        return;
      }
      const data = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
      stream.write(data);
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    if (this.fileStream) {
      const stream = this.fileStream;
      this.fileStream = null;
      stream.end();
      callback();
    } else {
      callback();
    }
  }
}
