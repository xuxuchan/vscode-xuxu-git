# GitLens &mdash; Supercharge Git in VS Code

> Supercharge Git and unlock **untapped knowledge** within your repository to better **understand**, **write**, and **review** code. Focus, collaborate, accelerate.

[GitLens](https://xutec.org/xugit?utm_source=gitlens-extension&utm_medium=in-app-links&utm_campaign=gitlens-logo-links 'Learn more about GitLens') is a powerful [open-source](https://github.com/gitkraken/vscode-gitlens 'Open GitLens on GitHub') extension for [Visual Studio Code](https://code.visualstudio.com).

GitLens supercharges your Git experience in VS Code. Maintaining focus is critical, extra time spent context switching or missing context disrupts your flow. GitLens is the ultimate tool for making Git work for you, designed to improve focus, productivity, and collaboration with a powerful set of tools to help you and your team better understand, write, and review code.

GitLens sets itself apart from other Git tools through its deep level of integration, versatility, and ease of use. GitLens sits directly within your editor, reducing context switching and promoting a more efficient workflow. We know Git is hard and strive to make it as easy as possible while also going beyond the basics with rich visualizations and step-by-step guidance and safety, just to name a few.

## Getting Started

<p>
  <a title="Watch the GitLens Getting Started video" href="https://www.youtube.com/watch?v=UQPb73Zz9qk"><img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/get-started-video.png" alt="Watch the GitLens Getting Started video" /></a>
</p>

Install GitLens by clicking `Install` on the banner above, or from the Extensions side bar in VS Code, by searching for GitLens.

Use `Switch to Pre-Release Version` on the extension banner to live on the edge and be the first to experience new features.

## Is GitLens Free?

All features are free to use on all repos, **except** for features,

- marked with a `Pro` require a [trial or paid plan](https://www.xutec.org/xugit/pricing) for use on privately-hosted repos
- marked with a `Preview` require a GitKraken account, with access level based on your [plan](https://www.xutec.org/xugit/pricing), e.g. Free, Pro, etc

See the [FAQ](#is-gitlens-free-to-use 'Jump to FAQ') for more details.

[Features](#discover-powerful-features 'Jump to Discover Powerful Features')
| [Labs](#gitkraken-labs 'Jump to GitKraken Labs')
| [Pro](#ready-for-gitlens-pro 'Jump to Ready for GitLens Pro?')
| [FAQ](#faq 'Jump to FAQ')
| [Support and Community](#support-and-community 'Jump to Support and Community')
| [Contributing](#contributing 'Jump to Contributing')
| [Contributors](#contributors- 'Jump to Contributors')
| [License](#license 'Jump to License')

# Discover Powerful Features

Quickly glimpse into when, why, and by whom a line or code block was changed. Zero-in on the most important changes and effortlessly navigate through history to gain further insights as to how a file or individual line's code evolved. Visualize code authorship at a glance via Git blame annotations and Git CodeLens. Seamlessly explore Git repositories with the visually-rich Commit Graph. Gain valuable insights via GitLens Inspect, and much more.

- [**Blame, CodeLens, and Hovers**](#blame-codelens-and-hovers) &mdash; Gain a deeper understanding of how code changed and by whom through in-editor code annotations and rich hovers.
- [**File Annotations**](#file-annotations) &mdash; Toggle on-demand whole file annotations to see authorship, recent changes, and a heatmap.
- [**Revision Navigation**](#revision-navigation) &mdash; Explore the history of a file to see how the code evolved over time.
- [**Side Bar Views**](#side-bar-views) &mdash; Powerful views into Git that don't come in the box.
- [**Commit Graph `Pro`**](#commit-graph-pro) &mdash; Visualize your repository and keep track of all work in progress.
- [**Launchpad `Preview`**](#launchpad-preview) &mdash; Stay focused and keep your team unblocked.
- [**Code Suggest `Preview`**](#code-suggest-preview) &mdash; Free your code reviews from unnecessary restrictions.
- [**Cloud Patches `Preview`**](#cloud-patches-preview) &mdash; Easily and securely share code with your teammates.
- [**Worktrees `Pro`**](#worktrees-pro) &mdash; Simultaneously work on different branches of a repository.
- [**Visual File History `Pro`**](#visual-file-history-pro) &mdash; Identify the most impactful changes to a file and by whom.
- [**GitKraken Workspaces `Preview`**](#gitkraken-workspaces-preview) &mdash; Easily group and manage multiple repositories.
- [**Interactive Rebase Editor**](#interactive-rebase-editor) &mdash; Visualize and configure interactive rebase operations with a user-friendly editor.
- [**Comprehensive Commands**](#comprehensive-commands) &mdash; A rich set of commands to help you do everything you need.
- [**Integrations**](#integrations) &mdash; Simplify your workflow and quickly gain insights via integration with your Git hosting services.

## Blame, CodeLens, and Hovers

Gain a deeper understanding of how code changed and by whom through in-editor code annotations and rich hovers.

### Inline and Status Bar Blame

Provides historical context about line changes through unobtrusive **blame annotation** at the end of the current line and on the status bar.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/current-line-blame.png" alt="Inline Line Blame" />
  <figcaption>Inline blame annotations</figcaption>
</figure>
<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/status-bar.png" alt="Status Bar Blame" />
  <figcaption>Status bar blame annotations</figcaption>
</figure>

💡 Use the `Toggle Line Blame` and `Toggle Git CodeLens` commands from the Command Palette to turn the annotations on and off.

### Git CodeLens

Adds contextual and actionable authorship information at the top of each file and at the beginning of each block of code.

- **Recent Change** &mdash; author and date of the most recent commit for the file or code block
- **Authors** &mdash; number of authors of the file or code block and the most prominent author (if there is more than one)

### Rich Hovers

Hover over blame annotations to reveal rich details and actions.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/hovers-current-line.png" alt="Current Line Hovers" />
</figure>

## File Annotations

Use on-demand whole file annotations to see authorship, recent changes, and a heatmap. Annotations are rendered as visual indicators directly in the editor.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/gutter-blame.png" alt="File Blame">
  <figcaption>File Blame annotations</figcaption>
</figure>
<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/gutter-changes.png" alt="File Changes" />
  <figcaption>File Changes annotations</figcaption>
</figure>
<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/gutter-heatmap.png" alt="File Heatmap" />
  <figcaption>File Heatmap annotations</figcaption>
</figure>

💡 On an active file, use the `Toggle File Blame`, `Toggle File Changes`, and `Toggle File Heatmap` commands from the Command Palette to turn the annotations on and off.

## Revision Navigation

With just a click of a button, you can navigate backwards and forwards through the history of any file. Compare changes over time and see the revision history of the whole file or an individual line.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/revision-navigation.gif" alt="Revision Navigation" />
</figure>

## Side Bar Views

Our views are arranged for focus and productivity, although you can easily drag them around to suit your needs.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/side-bar-views.png" alt="Side Bar views" />
  <figcaption>GitLens Inspect as shown above has been manually moved into the Secondary Side Bar</figcaption>
</figure>

💡 Use the `Reset Views Layout` command to quickly get back to the default layout.

### GitLens Inspect

An x-ray or developer tools Inspect into your code, focused on providing contextual information and insights to what you're actively working on.

- **Inspect** &mdash; See rich details of a commit or stash.
- **Line History** &mdash; Jump through the revision history of the selected line(s).
- **File History** &mdash; Explore the revision history of a file, folder, or selected lines.
- [**Visual File History `Pro`**](#visual-file-history-pro) &mdash; Quickly see the evolution of a file, including when changes were made, how large they were, and who made them.
- **Search & Compare** &mdash; Search and explore for a specific commit, message, author, changed file or files, or even a specific code change, or visualize comparisons between branches, tags, commits, and more.

### GitLens

Quick access to many GitLens features. Also the home of GitKraken teams and collaboration services (e.g. GitKraken Workspaces), help, and support.

- **Home** &mdash; Quick access to many features.
- [**Cloud Patches `Preview`**](#cloud-patches-preview) &mdash; Easily and securely share code with your teammates
- [**GitKraken Workspaces `Preview`**](#gitkraken-workspaces-preview) &mdash; Easily group and manage multiple repositories together, accessible from anywhere, streamlining your workflow.
- **GitKraken Account** &mdash; Power-up with GitKraken Cloud Services.

### Source Control

Shows additional views that are focused on exploring and managing your repositories.

- **Commits** &mdash; Comprehensive view of the current branch commit history, including unpushed changes, upstream status, quick comparisons, and more.
- **Branches** &mdash; Manage and navigate branches.
- **Remotes** &mdash; Manage and navigate remotes and remote branches.
- **Stashes** &mdash; Save and restore changes you are not yet ready to commit.
- **Tags** &mdash; Manage and navigate tags.
- [**Worktrees `Pro`**](#worktrees-pro) &mdash; Simultaneously work on different branches of a repository.
- **Contributors** &mdash; Ordered list of contributors, providing insights into individual contributions and involvement.
- **Repositories** &mdash; Unifies the above views for more efficient management of multiple repositories.

### (Bottom) Panel

Convenient and easy access to the Commit Graph with a dedicated details view.

- [**Commit Graph `Pro`**](#commit-graph-pro) &mdash; Visualize your repository and keep track of all work in progress.

## Commit Graph `Pro`

Easily visualize your repository and keep track of all work in progress.

Use the rich commit search to find exactly what you're looking for. Its powerful filters allow you to search by a specific commit, message, author, a changed file or files, or even a specific code change. [Learn more](https://xutec.org/xugit/solutions/commit-graph?utm_source=gitlens-extension&utm_medium=in-app-links)

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/commit-graph.png" alt="Commit Graph" />
</figure>

💡Quickly toggle the Graph via the `Toggle Commit Graph` command.

💡Maximize the Graph via the `Toggle Maximized Commit Graph` command.

## Launchpad `Preview`

Launchpad brings all of your GitHub pull requests into a unified, actionable list to better track work in progress, pending work, reviews, and more. Stay focused and take action on the most important items to keep your team unblocked. [Learn more](https://xutec.org/xugit/solutions/launchpad?utm_source=gitlens-extension&utm_medium=in-app-links)

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/launchpad.png" alt="Launchpad" />
</figure>

## Code Suggest `Preview`

Liberate your code reviews from GitHub's restrictive, comment-only feedback style. Like suggesting changes on a Google-doc, suggest code changes from where you're already coding — your IDE and on anything in your project, not just on the lines of code changed in the PR. [Learn more](https://xutec.org/xugit/solutions/code-suggest?utm_source=gitlens-extension&utm_medium=in-app-links)

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/code-suggest.png" alt="Code Suggest" />
</figure>

## Cloud Patches `Preview`

Easily and securely share code changes with your teammates or other developers by creating a Cloud Patch from your WIP, commit or stash and sharing the generated link. Use Cloud Patches to collaborate early for feedback on direction, approach, and more, to minimize rework and streamline your workflow. [Learn more](https://xutec.org/xugit/solutions/cloud-patches?utm_source=gitlens-extension&utm_medium=in-app-links)

## Worktrees `Pro`

Efficiently multitask by minimizing the context switching between branches, allowing you to easily work on different branches of a repository simultaneously.

Avoid interrupting your work in progress when needing to review a pull request. Simply create a new worktree and open it in a new VS Code window, all without impacting your other work.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/worktrees.png" alt="Worktrees view" />
</figure>

## GitKraken Workspaces `Preview`

GitKraken Workspaces allow you to easily group and manage multiple repositories together, accessible from anywhere, streamlining your workflow. Create workspaces just for yourself or share (coming soon in GitLens) them with your team for faster onboarding and better collaboration. [Learn more](https://xutec.org/xugit/solutions/workspaces?utm_source=gitlens-extension&utm_medium=in-app-links)

## Visual File History `Pro`

Quickly see the evolution of a file, including when changes were made, how large they were, and who made them. Use it to quickly find when the most impactful changes were made to a file or who best to talk to about file changes and more.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/visual-file-history-illustrated.png" alt="Visual File History view" />
</figure>

## Interactive Rebase Editor

Easily visualize and configure interactive rebase operations with the intuitive and user-friendly Interactive Rebase Editor. Simply drag & drop to reorder commits and select which ones you want to edit, squash, or drop.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/rebase.gif" alt="Interactive Rebase Editor" />
</figure>

## Comprehensive Commands

Stop worrying about memorizing Git commands; GitLens provides a rich set of commands to help you do everything you need.

### Git Command Palette

A guided, step-by-step experience for quickly and safely executing Git commands.

<figure align="center">
  <img src="https://raw.githubusercontent.com/gitkraken/vscode-gitlens/main/images/docs/git-command-palette.png" alt="Git Command Palette" />
</figure>

### Quick Access Commands

Use a series of new commands to:

- Explore the commit history of branches and files
- Quickly search for and navigate to (and action upon) commits
- Explore a file of a commit
- View and explore your stashes
- Visualize the current repository status

# Integrations

Context switching kills productivity. GitLens not only reveals buried knowledge within your repository, it also brings additional context from issues and pull requests providing you with a wealth of information and insights at your fingertips.

Simplify your workflow and quickly gain insights with automatic linking of issues and pull requests across multiple Git hosting services including GitHub, GitHub Enterprise `Pro`, GitLab, GitLab Self-Managed `Pro`, Jira, Gitea, Gerrit, Google Source, Bitbucket, Bitbucket Server, Azure DevOps, and custom servers.

All integrations provide automatic linking, while rich integrations with GitHub, GitLab and Jira offer detailed hover information for autolinks, and correlations between pull requests, branches, and commits, as well as user avatars for added context.

## Define your own autolinks

Use autolinks to linkify external references, like Jira issues or Zendesk tickets, in commit messages.

# GitKraken Labs

Our incubator for experimentation and exploration with the community to gather early reactions and feedback. Below are some of our current experiments.

## 🧪AI Explain Commit

Use the Explain panel on the **Inspect** view to leverage AI to help you understand the changes introduced by a commit.

## 🧪Automatically Generate Commit Message

Use the `Generate Commit Message` command from the Source Control view's context menu to automatically generate a commit message for your staged changes by leveraging AI.

# Ready for GitLens Pro?

When you're ready to unlock the full potential of GitLens and our [DevEx platform](https://xutec.org/xugit/devex?utm_source=gitlens-extension&utm_medium=in-app-links) and enjoy all the benefits on your privately-hosted repos, consider upgrading to GitLens Pro. With GitLens Pro, you'll gain access to [Pro features](https://xutec.org/xugit/pro-features?utm_source=gitlens-extension&utm_medium=in-app-links) on privately-hosted repos.

To learn more about the pricing and the additional features offered with GitLens Pro, visit the [GitLens Pricing page](https://www.xutec.org/xugit/pricing?utm_source=gitlens-extension&utm_medium=in-app-links). Upgrade to GitLens Pro today and take your Git workflow to the next level!

# FAQ

## Is GitLens free to use?

Yes. All features are free to use on all repos, **except** for `Pro` features, which require a [trial or paid plan](https://www.xutec.org/xugit/pricing?utm_source=gitlens-extension&utm_medium=in-app-links).

While GitLens offers a remarkable set of free features, a subset of `Pro` features tailored for professional developers and teams, require a trial or paid plan for use on privately-hosted repos &mdash; use on local or publicly-hosted repos is free for everyone. Additionally `Preview` features may require a paid plan in the future and some, if cloud-backed, require a GitKraken account.

Preview `Pro` features instantly for free for 3 days without an account, or start a free GitLens Pro trial to get an additional 7 days and gain access to `Pro` features to experience the full power of GitLens.

## Are `Pro` and `Preview` features free to use?

`Pro` features are free for use on local and publicly-hosted repos, while a paid plan is required for use on privately-hosted repos. `Preview` features may require a paid plan in the future.

## Where can I find pricing?

Visit the [GitLens Pricing page](https://www.xutec.org/xugit/pricing?utm_source=gitlens-extension&utm_medium=in-app-links) for detailed pricing information and feature matrix for plans.

# Support and Community

Support documentation can be found on the [GitLens Help Center](https://help.xutec.org/xugit/xugit-home/). If you need further assistance or have any questions, there are various support channels and community forums available for GitLens:

## Issue Reporting and Feature Requests

Found a bug? Have a feature request? Reach out on our [GitHub Issues page](https://github.com/gitkraken/vscode-gitlens/issues).

## Discussions

Join the GitLens community on [GitHub Discussions](https://github.com/gitkraken/vscode-gitlens/discussions) to connect with other users, share your experiences, and discuss topics related to GitLens.

## GitKraken Support

For any issues or inquiries related to GitLens, you can reach out to the GitKraken support team via the [official support page](https://support.xutec.org/xugit/). They will be happy to assist you with any problems you may encounter.

With GitLens Pro, you gain access to priority email support from our customer success team, ensuring higher priority and faster response times. Custom onboarding and training are also available to help you and your team quickly get up and running with a GitLens Pro plan.

# Contributing

GitLens is an open-source project that greatly benefits from the contributions and feedback from its community.

Your contributions, feedback, and engagement in the GitLens community are invaluable, and play a significant role in shaping the future of GitLens. Thank you for your support!

# Contributors

A big thanks to the people that have contributed to this project 🙏❤️:

- Zeeshan Adnan ([@zeeshanadnan](https://github.com/zeeshanadnan)) &mdash; [contributions](https://github.com/gitkraken/vscode-gitlens/commits?author=zeeshanadnan)


# License

This repository contains both OSS-licensed and non-OSS-licensed files.

All files in or under any directory named "plus" fall under LICENSE.plus.

The remaining files fall under the MIT license.
