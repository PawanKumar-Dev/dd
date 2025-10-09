#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');

// Ports to kill
const PORTS = [3000, 3001, 3002];

/**
 * Kill processes running on specified ports
 * @param {number[]} ports - Array of port numbers to kill
 */
async function killPorts(ports) {
  const platform = os.platform();

  console.log(`🔍 Checking for processes on ports: ${ports.join(', ')}`);

  for (const port of ports) {
    try {
      await killPort(port, platform);
    } catch (error) {
      console.error(`❌ Error killing port ${port}:`, error.message);
    }
  }
}

/**
 * Kill processes on a specific port
 * @param {number} port - Port number to kill
 * @param {string} platform - Operating system platform
 */
function killPort(port, platform) {
  return new Promise((resolve, reject) => {
    let command;

    if (platform === 'win32') {
      // Windows command
      command = `netstat -ano | findstr :${port}`;
    } else {
      // Unix-like systems (Linux, macOS) - use netstat instead of lsof
      command = `netstat -tulpn | grep :${port}`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        // No process found on this port
        console.log(`✅ Port ${port} is already free`);
        return resolve();
      }

      if (platform === 'win32') {
        // Parse Windows netstat output
        const lines = stdout.trim().split('\n');
        const pids = new Set();

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          }
        });

        if (pids.size === 0) {
          console.log(`✅ Port ${port} is already free`);
          return resolve();
        }

        // Kill each process
        pids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (killError) {
              console.error(`❌ Failed to kill process ${pid} on port ${port}:`, killError.message);
            } else {
              console.log(`✅ Killed process ${pid} on port ${port}`);
            }
          });
        });

        resolve();
      } else {
        // Unix-like systems - parse netstat output
        const lines = stdout.trim().split('\n');
        const pids = new Set();

        lines.forEach(line => {
          // Parse netstat output: tcp6 0 0 :::3000 :::* LISTEN 118942/next-server
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 7) {
            const pidProcess = parts[6]; // e.g., "118942/next-server"
            const pid = pidProcess.split('/')[0];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          }
        });

        if (pids.size === 0) {
          console.log(`✅ Port ${port} is already free`);
          return resolve();
        }

        // Kill each process
        pids.forEach(pid => {
          exec(`kill -9 ${pid}`, (killError) => {
            if (killError) {
              console.error(`❌ Failed to kill process ${pid} on port ${port}:`, killError.message);
            } else {
              console.log(`✅ Killed process ${pid} on port ${port}`);
            }
          });
        });

        resolve();
      }
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting port cleanup...\n');

  try {
    await killPorts(PORTS);
    console.log('\n✨ Port cleanup completed!');
  } catch (error) {
    console.error('\n❌ Port cleanup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node kill-ports.js [options]

Options:
  --help, -h     Show this help message
  --ports        Specify custom ports (comma-separated)
                 Example: node kill-ports.js --ports 3000,8080,9000

Default ports: 3000, 3001, 3002
    `);
    process.exit(0);
  }

  if (args.includes('--ports')) {
    const portsIndex = args.indexOf('--ports');
    if (portsIndex + 1 < args.length) {
      const customPorts = args[portsIndex + 1].split(',').map(port => {
        const num = parseInt(port.trim());
        if (isNaN(num) || num < 1 || num > 65535) {
          throw new Error(`Invalid port number: ${port}`);
        }
        return num;
      });
      PORTS.length = 0;
      PORTS.push(...customPorts);
    }
  }

  main();
}

module.exports = { killPorts, killPort };
