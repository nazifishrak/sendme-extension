import { homedir } from "os";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { ShareSession } from "../types";
import { globalSessions } from "../sessionManager";

export const getSendmePath = (): string => {
  const possiblePaths = [
    "./sendme",
    path.join(homedir(), "sendme"),
    "/usr/local/bin/sendme",
    "/opt/homebrew/bin/sendme",
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {
      continue;
    }
  }

  return "sendme"; // Fallback to PATH lookup
};

export const extractTicket = (output: string): string | null => {
  const lines = output.split("\n");
  
  // Look for "sendme receive" line
  for (const line of lines) {
    if (line.includes("sendme receive")) {
      const parts = line.split("sendme receive ");
      if (parts.length >= 2) return parts[1].trim();
    }
  }

  // Look for blob string pattern
  const blobMatch = output.match(/blob[a-zA-Z0-9]{100,}/);
  if (blobMatch) return blobMatch[0];

  return null;
};

export const startSendmeProcess = (filePath: string, sessionId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const sendmePath = getSendmePath();
      const childProcess = spawn(sendmePath, ["send", filePath], {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        cwd: homedir(),
        env: { ...process.env, HOME: homedir() },
      });

      let outputBuffer = "";
      let extractedTicket: string | null = null;

      childProcess.stdout.on("data", (data) => {
        outputBuffer += data.toString();
        const ticket = extractTicket(outputBuffer);
        if (ticket && !extractedTicket) {
          extractedTicket = ticket;
          resolve(ticket);
        }
      });

      childProcess.stderr.on("data", (data) => {
        outputBuffer += data.toString();
        const ticket = extractTicket(outputBuffer);
        if (ticket && !extractedTicket) {
          extractedTicket = ticket;
          resolve(ticket);
        }
      });

      childProcess.on("error", reject);
      childProcess.unref();

      // Update session with process info
      const session = globalSessions.getSessions().find(s => s.id === sessionId);
      if (session) {
        session.process = childProcess;
        session.pid = childProcess.pid;
      }

      // Set timeout for ticket extraction
      setTimeout(() => {
        if (!extractedTicket) {
          reject(new Error("Timeout waiting for ticket"));
        }
      }, 5000);
    } catch (error) {
      reject(error);
    }
  });
};
