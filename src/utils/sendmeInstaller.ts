import { spawn, exec } from "child_process";
import { homedir } from "os";
import { existsSync } from "fs";
import { join } from "path";
import { showHUD, confirmAlert, getPreferenceValues, showToast, Toast, open, Clipboard } from "@raycast/api";
import { promisify } from "util";

const execAsync = promisify(exec);

interface Preferences {
  autoInstallSendme?: boolean;
}

// Runs a command and returns stdout, stderr, and exit code
async function runCommand(command: string, args: string[] = [], options?: { cwd?: string }): Promise<{stdout: string; stderr: string; exitCode: number}> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, options);
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    proc.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode || 0 });
    });
    
    proc.on("error", () => {
      resolve({ stdout, stderr, exitCode: 1 });
    });
  });
}

// Check if sendme is installed - looking specifically for ./sendme
export async function checkSendmeInstalled(): Promise<boolean> {
  console.log("Checking if sendme is installed");
  
  // First check current directory
  if (existsSync("./sendme")) {
    console.log("Found ./sendme in current directory");
    return true;
  }

  // Check user's home directory
  const homeSendme = join(homedir(), "sendme");
  if (existsSync(homeSendme)) {
    console.log("Found sendme in home directory");
    return true;
  }

  // Check homebrew locations
  const brewPaths = [
    "/usr/local/bin/sendme",
    "/opt/homebrew/bin/sendme"
  ];
  
  for (const path of brewPaths) {
    if (existsSync(path)) {
      console.log(`Found sendme at ${path}`);
      return true;
    }
  }
  
  // Last resort, check PATH
  const whichResult = await runCommand("which", ["sendme"]);
  if (whichResult.exitCode === 0 && whichResult.stdout.trim()) {
    console.log(`Found sendme in PATH: ${whichResult.stdout.trim()}`);
    return true;
  }

  console.log("Sendme not found");
  return false;
}

// More robust check if Homebrew is installed
async function isHomebrewInstalled(): Promise<boolean> {
  console.log("Checking if Homebrew is installed");
  
  // First, check common Homebrew binary locations
  const brewPaths = [
    "/usr/local/bin/brew",
    "/opt/homebrew/bin/brew",
    "/home/linuxbrew/.linuxbrew/bin/brew"
  ];
  
  for (const brewPath of brewPaths) {
    if (existsSync(brewPath)) {
      console.log(`Found Homebrew at ${brewPath}`);
      return true;
    }
  }
  
  // Next, check if brew is in PATH
  try {
    const { stdout, stderr, exitCode } = await runCommand("which", ["brew"]);
    console.log("which brew result:", { stdout, stderr, exitCode });
    
    if (exitCode === 0 && stdout.trim()) {
      console.log(`Found Homebrew in PATH: ${stdout.trim()}`);
      return true;
    }
  } catch (e) {
    console.error("Error checking for brew in PATH:", e);
  }
  
  // If all else fails, try running a simple brew command
  try {
    const { exitCode } = await runCommand("brew", ["--version"]);
    console.log(`brew --version exit code: ${exitCode}`);
    if (exitCode === 0) {
      console.log("Homebrew is available via brew command");
      return true;
    }
  } catch (e) {
    console.error("Error running brew --version:", e);
  }
  
  console.log("Homebrew does not appear to be installed");
  return false;
}

// Improved Homebrew installation
async function installWithHomebrew(): Promise<boolean> {
  try {
    await showHUD("Installing sendme with Homebrew...");
    console.log("Installing sendme with Homebrew");
    
    // Test Homebrew functionality first
    const versionCheck = await runCommand("brew", ["--version"]);
    console.log("brew --version result:", versionCheck);
    
    if (versionCheck.exitCode !== 0) {
      console.error("Homebrew doesn't seem to be working properly");
      throw new Error("Homebrew doesn't seem to be working properly");
    }
    
    // Add the tap if needed
    console.log("Adding tap n0-computer/iroh");
    const tapResult = await runCommand("brew", ["tap", "n0-computer/iroh"]);
    console.log("Tap result:", tapResult);
    
    if (tapResult.exitCode !== 0) {
      console.warn("Tap command failed, but we'll continue anyway:", tapResult.stderr);
      // We'll continue anyway in case the tap already exists or isn't needed
    }
    
    // Install sendme
    console.log("Installing sendme via brew");
    const result = await runCommand("brew", ["install", "sendme"]);
    console.log("Brew install result:", result);
    
    if (result.exitCode === 0) {
      await showToast({
        style: Toast.Style.Success,
        title: "Installation successful",
        message: "sendme was installed using Homebrew"
      });
      
      // Verify the installation
      const whichResult = await runCommand("which", ["sendme"]);
      console.log("Which sendme result after install:", whichResult);
      
      return true;
    } else {
      console.error("Installation failed with exit code", result.exitCode);
      console.error("stderr:", result.stderr);
      throw new Error(`Installation failed: ${result.stderr}`);
    }
  } catch (error) {
    console.error("Homebrew installation failed:", error);
    return false;
  }
}

// Install sendme using the curl command in terminal
async function installWithCurl(): Promise<boolean> {
  try {
    console.log("Starting terminal installation process");
    const confirmed = await confirmAlert({
      title: "Install sendme Using Terminal",
      message: "We need to run 'curl -fsSL https://iroh.computer/sendme.sh | sh' in your terminal to install sendme. This will download and set up the sendme CLI tool.",
      primaryAction: {
        title: "Open Terminal & Install",
      },
      dismissAction: {
        title: "Cancel"
      }
    });
    
    if (!confirmed) {
      console.log("User cancelled terminal installation");
      return false;
    }
    
    // Show a clear message
    await showToast({
      style: Toast.Style.Animated,
      title: "Opening Terminal",
      message: "Follow the instructions in Terminal to complete installation"
    });
    
    // Run the command in a new Terminal window - double the escaped quotes to work in AppleScript
    const appleScript = `
      tell application "Terminal"
        activate
        do script "cd \\"${homedir().replace(/"/g, '\\\\"')}\\" && curl -fsSL https://iroh.computer/sendme.sh | sh"
      end tell
    `;
    
    await execAsync(`osascript -e '${appleScript}'`);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Installation started",
      message: "Please follow the instructions in Terminal"
    });
    
    // We assume this will succeed, but can't verify directly since it runs in Terminal
    return true;
  } catch (error) {
    console.error("Terminal installation failed:", error);
    return false;
  }
}

// Main installation entry point with more verbose logging
export async function installSendme(): Promise<boolean> {
  console.log("Starting sendme installation");
  
  // Check if Homebrew is available
  const hasHomebrew = await isHomebrewInstalled();
  console.log("Homebrew available:", hasHomebrew);
  
  if (hasHomebrew) {
    // Try to install with Homebrew
    console.log("Trying Homebrew installation");
    const brewSuccess = await installWithHomebrew();
    
    // Check if sendme is now installed
    const isNowInstalled = await checkSendmeInstalled();
    console.log("Is sendme now installed after brew attempt?", isNowInstalled);
    
    if (brewSuccess && isNowInstalled) {
      console.log("Homebrew installation successful");
      return true;
    }
    
    console.log("Homebrew installation failed or didn't create sendme, trying curl");
  } else {
    console.log("Homebrew not available, skipping to curl method");
  }
  
  // If Homebrew failed or isn't available, try the curl method
  return await installWithCurl();
}

// Main function to ensure sendme is available
export async function ensureSendmeAvailable(): Promise<boolean> {
  console.log("Ensuring sendme is available");
  const isSendmeInstalled = await checkSendmeInstalled();
  
  if (isSendmeInstalled) {
    console.log("Sendme is already installed");
    return true;
  }
  
  console.log("Sendme not found, checking preferences");
  
  // Get user preference for auto-installation
  const preferences = getPreferenceValues<Preferences>();
  
  // If auto-install is enabled, install without asking
  if (preferences.autoInstallSendme) {
    console.log("Auto-install enabled, installing sendme");
    return await installSendme();
  }
  
  // Ask the user what they want to do
  const hasHomebrew = await isHomebrewInstalled();
  const shouldInstall = await confirmAlert({
    title: "Sendme Not Found",
    message: `The sendme tool is required but not found on your system. Would you like to install it? ${
      hasHomebrew ? "We'll use Homebrew since it's installed." : "We'll use a Terminal command to install it."
    }`,
    primaryAction: {
      title: "Install sendme",
    },
    dismissAction: {
      title: "Install Manually",
    }
  });
  
  if (shouldInstall) {
    console.log("User chose to install sendme");
    return await installSendme();
  } else {
    console.log("User chose to install manually");
    // Handle manual installation
    open("https://github.com/n0-computer/sendme#installation");
    await showHUD("Installation cancelled. Please install sendme manually to use this extension.");
    return false;
  }
}

// Helper function to check if Homebrew is installed - accessible from other modules
export async function hasHomebrew(): Promise<boolean> {
  return await isHomebrewInstalled();
}
