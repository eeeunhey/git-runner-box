# 🏃 git-runner

> A tiny runner that moves with your GitHub activity — Dynamic Pinned Gist

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/git-runner-gist/build.yml?label=CI" alt="CI">
  <img src="https://img.shields.io/github/license/YOUR_USERNAME/git-runner-gist" alt="License">
</p>

```text
🏃 git-runner · 2026

🌿━━━━━━🏃━━━━━━━━━━🌳

● Today   🔥 8 days   🏆 27   🌱 103/142
```

Your GitHub profile shows a tiny running course that changes every day.
When you code, the runner runs 🏃. When you rest, the runner rests 🧘. No judgment.

## ✨ Features

- **365-day journey** — Scenery changes with the seasons
- **Daily scene rotation** — Different landscape every day within each season
- **Streak tracking** — Current streak, longest streak, active days
- **No punishment** — Missing a day is resting, not failing
- **Timezone aware** — Configurable timezone for accurate day boundaries

## 🚀 Setup (5 minutes)

### 1. Create a Gist

[Create a new public Gist](https://gist.github.com/) with any filename and content.

### 2. Create a Token

[Create a Personal Access Token](https://github.com/settings/tokens/new) with the `gist` scope.

### 3. Create a Repository

Create a new repository (or use an existing one) and add the following secrets:

| Secret | Value |
|---|---|
| `GH_TOKEN` | The Personal Access Token from step 2 |
| `GIST_ID` | The ID of the Gist from step 1 (the long string in the URL) |

### 4. Create the Workflow

Create `.github/workflows/git-runner.yml`:

```yaml
name: 🏃 git-runner

on:
  schedule:
    - cron: '0 0,6,12 * * *'  # Every 8 hours
  workflow_dispatch:           # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: YOUR_USERNAME/git-runner-gist@v1
        with:
          gist_id: ${{ secrets.GIST_ID }}
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 5. Pin the Gist

Go to your GitHub profile and pin the Gist!

## ⚙️ Options

| Input | Required | Default | Description |
|---|---|---|---|
| `gist_id` | ✅ | — | The ID of the Gist to update |
| `timezone` | ❌ | `Asia/Seoul` | IANA timezone for date boundaries |
| `username` | ❌ | Token owner | GitHub username to track |

### Example with all options

```yaml
- uses: YOUR_USERNAME/git-runner-gist@v1
  with:
    gist_id: ${{ secrets.GIST_ID }}
    timezone: 'America/New_York'
    username: 'octocat'
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

## 🎨 Seasonal Scenes

The running course changes with the seasons:

| Season | Months | Example |
|---|---|---|
| 🌸 Spring | Mar–May | `🌸━━━━🏃━━━━━━━━🌸━━━━━━→` |
| ☀️ Summer | Jun–Aug | `☀━━━━🌻━━🏃━━━━🌻━━━━━━━→` |
| 🍁 Autumn | Sep–Nov | `🍁━━━━🏃━━━━━━━━🍂━━━━━━→` |
| ❄️ Winter | Dec–Feb | `❄━━━━✨━━🏃━━━━❄━━━━━━━━━→` |

Each season has 5 different scenes that rotate daily.

## 🏃 Runner States

| State | When | Display |
|---|---|---|
| 🏃 Running | Today has contributions | `● Today` |
| 🚶 Walking | No activity yet, but streak alive | `○ Today` |
| 🧘 Resting | Rest day (no streak) | `○ Today` |

## 📊 Stats Explained

```text
● Today   🔥 8 days   🏆 27   🌱 103/142
│         │           │       │
│         │           │       └── Active days / Journey day
│         │           └── Longest streak this year
│         └── Current streak
└── Today's activity (● active / ○ not yet)
```

## 📌 Related

This project is inspired by [awesome-pinned-gists](https://github.com/matchai/awesome-pinned-gists).

## 📄 License

This project is licensed under the [MIT License](LICENSE).
