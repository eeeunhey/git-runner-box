<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/eeeunhey/git-runner-box/build.yml?label=CI" alt="CI">
  <img src="https://img.shields.io/github/license/eeeunhey/git-runner-box" alt="License">
</p>

# 🏃✨ git-runner-box

> Are you keeping your streak alive? Let's check out your 365-day running journey in Gist!

```text
🏃 git-runner · Day 230 / 365
       ☀                 ☁
[🌱 ▓▓▓▓▓▓▓▓▓▓▓🏃💨░░░░░░ 🚩] 63%

● Today (5)   🔥 12 days   🏆 85   🌱 156/230
```

This project is inspired by the [awesome-pinned-gists](https://github.com/matchai/awesome-pinned-gists) project.

---

## 📌 Overview

This project uses the **GitHub GraphQL API** to fetch your daily contribution history and automatically updates your pinned Gist with a tiny 365-day running course via [@octokit/rest](https://github.com/octokit/rest.js#readme).

---

## 🚀 Setup

### Prep work

1. **Create a new public GitHub Gist** ([https://gist.github.com/](https://gist.github.com/))
   - Name the file `🏃 git-runner` (or any name you like) and add any placeholder content.
2. **Create a Personal Access Token** ([https://github.com/settings/tokens/new](https://github.com/settings/tokens/new))
   - Token type: **Classic Token**
   - Check the **`gist`** scope (and **`read:user`** scope).
   - Copy the generated token (`ghp_...`).

---

### Project setup

#### Method A: Fork this repository (Easiest)

1. **Fork** this repo: [eeeunhey/git-runner-box](https://github.com/eeeunhey/git-runner-box)
2. Open the **"Actions"** tab of your fork and click the **"I understand my workflows, go ahead and enable them"** button.
3. Go to your repo **Settings > Secrets and variables > Actions**, and add the following:

| Type | Name | Description |
|---|---|---|
| **Repository Secret** | `GH_TOKEN` | The GitHub Personal Access Token generated above |
| **Repository Secret** | `GIST_ID` | The ID portion from your Gist URL, e.g. `https://gist.github.com/user/`<ins>`a1b2c3d4...`</ins> |
| **Repository Variable** | `TIMEZONE` | *(Optional)* The timezone of your location, e.g. `Asia/Seoul`, `America/New_York` (Default: `Asia/Seoul`) |

4. **Manually run the workflow** for the first time or wait for the scheduled run. (Runs 3 times daily: 00:00, 06:00, 12:00 UTC)
5. [**Pin the newly created Gist**](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/pinning-items-to-your-profile) to your GitHub profile!

#### Method B: Use as a GitHub Action in your own repo

Add the following workflow file `.github/workflows/git-runner.yml` to your repository:

```yaml
name: Update gist

on:
  schedule:
    - cron: '0 0,6,12 * * *'  # 3 times a day
  workflow_dispatch:           # Manual trigger

jobs:
  update-gist:
    runs-on: ubuntu-latest
    steps:
      - uses: eeeunhey/git-runner-box@v1
        with:
          gist_id: ${{ secrets.GIST_ID }}
          timezone: ${{ vars.TIMEZONE || 'Asia/Seoul' }}
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

---

### 🕹️ How to run the workflow manually

1. Go to the **"Actions"** tab on your repo.
2. Select the **"Update gist"** workflow on the left sidebar.
3. Click the **"Run workflow"** button.

---

## 🎨 Seasonal Scenes & Runner States

### Seasonal Course

| Season | Months | Scenery Theme |
|---|---|---|
| 🌸 **Spring** | Mar – May | Cherry blossoms, sprouts, bees, butterflies (`🌸`, `🌱`, `🐝`, `🦋`) |
| ☀️ **Summer** | Jun – Aug | Sunshine, waves, sunflowers, green trees (`☀`, `🌊`, `🌻`, `🌳`) |
| 🍁 **Autumn** | Sep – Nov | Maple leaves, reeds, autumn moon (`🍁`, `🌾`, `🍂`, `🌙`) |
| ❄️ **Winter** | Dec – Feb | Snowflakes, sparkles, winter pines (`❄`, `✨`, `🌲`, `🌙`) |

### 🏃 Runner States & Daily Progression

The runner dynamically adapts based on your **daily commit count** and **streak continuity**:

| State | Daily Commits | Streak Status | Display | Description |
|---|---|---|---|---|
| 🏃💨 **Sprinting** | **≥ 5 commits** | Active (`🔥 N days`) | `● Today (N)` | **Super Sprint**: High productivity! The runner bursts forward with speed dust (`💨`). |
| 🏃 **Running** | **1 ~ 4 commits** | Active (`🔥 N days`) | `● Today (N)` | **Running Mode**: You coded today! The runner steadily runs through the course. |
| 🚶 **Walking** | **0 commits** | Protected (`🔥 N days`) | `○ Today (0)` | **Pacing Mode**: No commits yet today, but yesterday's streak is preserved. Warming up to code! |
| 🧘 **Resting** | **0 commits** | Reset (`🔥 0 days`) | `○ Today (0)` | **Rest Day**: Recharging for the next journey. A healthy break, zero punishment. |

> 💡 **Design Philosophy**:
> - **Non-punitive Streak**: If you haven't committed yet today, your previous streak is preserved as `🚶 Walking`. It does not reset until the day fully ends without contributions.
> - **Live Daily Count**: `● Today (N)` displays the exact number of commits / contributions made today.

---

## 📊 Stats Explained

```text
● Today (5)   🔥 12 days   🏆 85   🌱 156/230
│             │            │       │
│             │            │       └── Active days (156) / Day of year (230)
│             │            └── Longest streak this year
│             └── Current continuous streak
└── Today's activity (● active / ○ not yet) & commit count (5)
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
