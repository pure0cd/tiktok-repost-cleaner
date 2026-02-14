<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:111111,100:222222&height=200&section=header&text=TikTok%20Repost%20Cleaner&fontSize=48&fontAlignY=38&fontColor=ffffff&animation=fadeIn" width="100%" />

<img src="https://cdn.0cd.fun/github/tiktok-repost-cleaner/1.png" width="100%" alt="Screenshot">

<br>

# TikTok Repost Cleaner
**Bulk Remove Reposted Videos — Safely & Automatically**

> Unofficial project. Not affiliated with TikTok or ByteDance Ltd.

<br>

<p align="center">
  <img src="https://img.shields.io/badge/Browser-Chromium-black?style=for-the-badge&logo=googlechrome&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
</p>

</div>

---

## Overview

**TikTok Repost Cleaner** is a lightweight browser extension that scans your profile and removes reposted videos in bulk.

Built with safety delays, retry protection, and persistent state handling to minimize account risk.

---

## Features

### Smart Scan
Fetches reposted videos using TikTok’s internal API.

### Bulk Removal
Deletes reposts sequentially with configurable delay.

### Auto Retry
Handles failed requests using exponential backoff.


## Open Source

### Fully Transparent
All source code is publicly available and auditable.

### GPL-3.0 Licensed
Released under the GNU General Public License v3.0.

### Community Driven
Open to issues, discussions, and pull requests.

### Fork Friendly
You are free to use, modify, and redistribute under the same license.

---

## Installation

1. Download or clone this repository  
2. Open `chrome://extensions`  
3. Enable **Developer Mode**  
4. Click **Load unpacked**  
5. Select the extension folder  

---

## Configuration (Optional)

Edit `config.js`:

````
| Option      | Description                   |
| ----------- | ----------------------------- |
| debug       | Set to false to disable console logs
| initDelay   | Delay in milliseconds before retrieving secUid (to ensure page loads)
| deleteDelay | Delay between delete requests to avoid rate limiting
````

## License

Licensed under **GNU General Public License v3.0 (GPL-3.0)**.

You must preserve license notices and open-source derivative works under the same license.

---

## <img src="https://capsule-render.vercel.app/api?type=soft&height=80&color=gradient&text=Support&section=header&reversal=true" width="100%"/>
If you find this project helpful and would like to support the development, you can treat me to a coffee! ☕

**Donate via SocialBuzz:**
[https://sociabuzz.com/0cd/tribe](https://sociabuzz.com/0cd/tribe)

> *A huge thank you to everyone who has supported! Your support keeps this project alive.* ❤️

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:111111,100:222222&height=100&section=footer" width="100%" />
</div>