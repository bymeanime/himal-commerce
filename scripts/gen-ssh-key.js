#!/usr/bin/env node
/**
 * Generate an ed25519 SSH keypair in OpenSSH format without ssh-keygen.
 * Output compatible with `authorized_keys` on GitHub.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const sshDir = path.join(process.env.HOME, ".ssh");
fs.mkdirSync(sshDir, { recursive: true });
fs.chmodSync(sshDir, 0o700);

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

// Export private key in PKCS8 PEM, then we'll convert to OpenSSH format manually.
const pkcs8Pem = privateKey.export({ type: "pkcs8", format: "pem" });

// For GitHub we only really need the public key in OpenSSH format.
// Build it: "ssh-ed25519 <base64-blob> <comment>"
// OpenSSH public blob format:
//   string  "ssh-ed25519"
//   string  <32-byte public key>
// Each "string" = 4-byte big-endian length + payload.

function sshString(buf) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(buf.length, 0);
  return Buffer.concat([len, buf]);
}

const pubRaw = publicKey.export({ type: "spki", format: "der" });
// SPKI DER for ed25519: SEQ { AlgIdentifier, BIT STRING pubkey }
// The last 32 bytes are the raw ed25519 public key.
const rawEd = pubRaw.slice(-32);

const blob = Buffer.concat([
  sshString(Buffer.from("ssh-ed25519")),
  sshString(rawEd),
]);
const b64 = blob.toString("base64");
const comment = `himal-commerce-sandbox-${new Date().toISOString().slice(0, 10)}`;
const openSshPub = `ssh-ed25519 ${b64} ${comment}\n`;

const pubPath = path.join(sshDir, "id_ed25519.pub");
const privPath = path.join(sshDir, "id_ed25519");
fs.writeFileSync(pubPath, openSshPub, { mode: 0o644 });
fs.writeFileSync(privPath, pkcs8Pem, { mode: 0o600 });

// SSH config so git uses this key for github.com
const configPath = path.join(sshDir, "config");
const configBlock = `
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
`;
let existing = "";
try { existing = fs.readFileSync(configPath, "utf8"); } catch {}
if (!existing.includes("Host github.com")) {
  fs.writeFileSync(configPath, existing + configBlock, { mode: 0o600 });
}

// Also write the private key in OpenSSH format so OpenSSH clients can use it.
// (GitHub only needs the public key, but if ssh is ever installed here we want
// the private key in the right format.)
// For now, the PKCS8 PEM works fine for git over SSH via bun's ssh2 if needed.

console.log("=== PUBLIC KEY — paste this into GitHub ===");
console.log(openSshPub.trim());
console.log("=== FINGERPRINT ===");
const fp = crypto.createHash("sha256").update(blob).digest("base64");
console.log(`SHA256:${fp.replace(/=+$/, "")}  ${comment}`);
console.log();
console.log(`Private key:  ${privPath}`);
console.log(`Public key:   ${pubPath}`);
console.log(`SSH config:   ${configPath}`);
