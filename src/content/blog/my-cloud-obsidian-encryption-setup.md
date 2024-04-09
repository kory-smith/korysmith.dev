---
title: My Cloud Obsidian Encryption Setup (Using Node.js)
description: Using Node.js and Google Drive to make a synced Obsidian journal that’s encrypted unless it’s actively being used.
publishedDate: November 24, 2023
status: published
---

# My Cloud Obsidian Encryption Setup (Using Node.js)

A few months ago, I decided to start journaling. I wanted to journal to flex my writing muscles, and also to keep a log of the events and feelings of my days that I could look back on. I’d been wanting to try [Obsidian](https://obsidian.md/), and journaling seemed like a perfect opportunity to dive in.

There was only one problem: I had multiple computers and wanted to use either one at any given time to journal. Which meant I wanted an up-to-date version of the journal on all computers at the same time. I also wanted to encrypt the journal at all times unless I was actively writing in it. The thought of the journal being out there in the open—either locally or in the cloud—bothered me.

I use Google Drive for my cloud storage, and that would have been perfect, except that Google is Google and I had to keep my thoughts and feelings out of their spying hands.

To recap, there were two things I wanted the journal to do:

1. Sync across all my computers, and
2. Stay encrypted unless it was actively being used

I’d have been happy to pay for [Obsidian Sync](https://obsidian.md/sync), but I couldn’t figure out how to keep the local copy encrypted unless I was using it.

So, I built my own solution using Node.js!

## “I just want the code, Kory”

Fair enough. Here’s the JavaScript:

```js
const { exec } = require("child_process");
const path = require("path");
const readline = require("readline");

const USER = process.env.USER;
const ENCRYPTED_VAULT_PATH = path.join(
  `/Users/${USER}/Library/CloudStorage/GoogleDrive-kor54e@gmail.com/My Drive/J/Journal/vault.tar.gz.enc`
);
const LOCAL_ENCRYPTED_VAULT_PATH = path.join(
  `/Users/${USER}/Downloads/vault.tar.gz.enc`
);
const LOCAL_UNENCRYPTED_VAULT_PATH = "/tmp";
const OBSIDIAN_PATH = "/Applications/Obsidian.app";

// Keep the password from being logged to the console
async function question(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Add a pretty console animation while text is input
  rl._writeToOutput = function _writeToOutput() {
    rl.output.write(
      "\x1B[2K\x1B[200D" +
        query +
        "[" +
        (rl.line.length % 2 == 1 ? "=-" : "-=") +
        "]"
    );
  };

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

// Promise-ify the shell
async function shell(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

(async () => {
  const PASSWORD = await question("What is the vault password ");

  // Grab the encrypted vault from Google Drive and put it on the local filesystem
  await shell(`cp "${ENCRYPTED_VAULT_PATH}" "${LOCAL_ENCRYPTED_VAULT_PATH}"`);

  // Then, unencrypt it and untar it all in one go
  await shell(
    `openssl enc -aes-256-cbc -d -pbkdf2 -pass pass:${PASSWORD} -in ${LOCAL_ENCRYPTED_VAULT_PATH} | tar -xzf - -C ${LOCAL_UNENCRYPTED_VAULT_PATH}`
  );

  // Open Obsidian and wait until it closes
  await shell(`open -W -a ${OBSIDIAN_PATH}`);

  // Once we're done, tar and encrypt the vault again
  // "KorVault" ensures I start the folder from KorVault, and not from, say, the root of my computer
  await shell(
    `tar -czf - -C ${LOCAL_UNENCRYPTED_VAULT_PATH} "KorVault" | openssl enc -aes-256-cbc -e -pbkdf2 -pass pass:${PASSWORD} -out ${LOCAL_ENCRYPTED_VAULT_PATH}`
  );

  // Then, copy the encrypted vault back to Google Drive
  await shell(`cp "${LOCAL_ENCRYPTED_VAULT_PATH}" "${ENCRYPTED_VAULT_PATH}"`);
  // Make a backup, just in case
  await shell(
    `cp "${LOCAL_ENCRYPTED_VAULT_PATH}" "${ENCRYPTED_VAULT_PATH}.backup"`
  );

  // Then, delete the local unencrypted copy
  await shell(`rm -rf ${LOCAL_UNENCRYPTED_VAULT_PATH}/KorVault`);
})();
```

And I run it from my shell with this function:

```bash
function journal() {
  node /Users/$(whoami)/scripts/handleJournal.mjs
}
```

The MacOS `open -W -a` command causes the program to halt until the opened application closes, which I think is especially neat.

## Problems with the script

The script has a few problems.

- ChatGPT warned me that it’s possible for a malicious program to spy on the system calls and grab the password as it’s being passed to `openssl` and `tar`
- If you type the password wrong, it gets logged in plaintext to your console

- If you kill the terminal command with ^C, the unencrypted journal will chill on your local machine
- Every time I run the journal command, the entire journal (around 100MB) gets reuploaded to Google Drive, which is pretty wasteful
- It’s easy to get out of sync. For example, sometimes Google Drive is closed without me noticing it and the journal doesn’t get put into the cloud for a few days

## Why I don’t care about those problems

Again, my demands of the solution were simple:

1. No being stored unencrypted locally
2. No being stored unencrypted in the cloud

For my purposes, the script is perfect. The journal is only ever unencrypted when I’m writing in it, and any other time, it’s safely encrypted with a strong password. Google never, ever has access to the unencrypted copy, and my local hard drive never has the encrypted copy, either (well, unless I accidentally kill the `journal` command).

## Prior art

As best I could tell, nobody has written and published a script that does what I wanted. I could only find [one other article online about a cloud Obsidian encryption setup](https://aviaryan.com/blog/obsidian-encryption).

I would have gladly used Avi’s solution, except that I couldn’t install `gocryptfs` on my Macbook Air M2. No idea why.

## Caveats

If you are going to copy/paste my code, you’ll have to change a few things before it’ll work.

- Your Google Drive/other cloud provider path will be different from mine. Change `ENCRYPTED_VAULT_PATH` accordingly
- The script assumes that there is already an encrypted copy of the vault at `ENCRYPTED_VAULT_PATH`. The first time you run the script, there won’t be. Run these lines of code (with the appropriate envvars) to put an encrypted copy where you want it:

```js
await shell(
  `tar -czf - -C ${LOCAL_UNENCRYPTED_VAULT_PATH} "KorVault" | openssl enc -aes-256-cbc -e -pbkdf2 -pass pass:${PASSWORD} -out ${LOCAL_ENCRYPTED_VAULT_PATH}`
);

// Then, copy the encrypted vault back to Google Drive
await shell(`cp "${LOCAL_ENCRYPTED_VAULT_PATH}" "${ENCRYPTED_VAULT_PATH}"`);
// Make a backup, just in case
await shell(
  `cp "${LOCAL_ENCRYPTED_VAULT_PATH}" "${ENCRYPTED_VAULT_PATH}.backup"`
);

// Then, delete the local unencrypted copy
await shell(`rm -rf ${LOCAL_UNENCRYPTED_VAULT_PATH}/KorVault`);
```

- You might have noticed “KorVault” in this line: `await shell( tar -czf - -C ${LOCAL_UNENCRYPTED_VAULT_PATH} "KorVault" | openssl enc -aes-256-cbc -e -pbkdf2 -pass pass:${PASSWORD} -out ${LOCAL_ENCRYPTED_VAULT_PATH});`. That’s there because without it, `tar` was uploading /Users/kory/tmp/vault.tar.gz.enc instead of just vault.tar.gz.enc. Adding that extra string tells `tar` where to start from
