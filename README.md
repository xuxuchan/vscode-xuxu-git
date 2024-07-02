# XU-Git &mdash; Git 超级赋能

> 加速Git的使用，并解锁仓库中的**未开发知识**，以便更好地**理解**、**编写**和**审查**代码。专注，合作，加速。

[XU-Git](https://xutec.org/xugit?utm_source=xu-git-extension&utm_medium=in-app-links&utm_campaign=XU-Git-logo-links) 是一个强大的 [开源](https://github.com/xuxuchan/vscode-xuxu-git) 插件，用于 [Visual Studio Code](https://code.visualstudio.com)。

XU-Git 在 VS Code 中增强了你的 Git 体验。保持专注至关重要，额外的时间用于上下文切换或错过上下文会打断你的工作流。XU-Git 是让 Git 为你工作的终极工具，旨在通过一套强大的工具来提升你的专注力、生产力和协作能力，帮助你和你的团队更好地理解、编写和审核代码。

XU-Git 通过其深度集成、多功能性和易用性，将自己与其他 Git 工具区分开来。XU-Git 直接嵌入你的编辑器中，减少了上下文切换并促进更高效的工作流。我们知道 Git 很难使用，因此我们努力使其尽可能简单，同时还提供丰富的可视化和逐步指导与安全性，仅举几例。

## 开始使用

通过点击上方横幅上的 `安装` 或在 VS Code 的扩展侧边栏中搜索 XU-Git 来安装 XU-Git。

在扩展横幅上使用 `切换到预览版` 以尝鲜，并成为第一个体验新功能的人。

## XU-Git 是免费的吗？

除了下列功能外，所有功能在所有仓库上都可以免费使用，

- 标有 `Pro` 的功能需要在私有托管仓库上使用时，需[试用或付费计划](https://www.xutec.org/xugit/pricing)
- 标有 `Preview` 的功能需要 XU-Tec 账户，访问级别取决于你的[计划](https://www.xutec.org/xugit/pricing)，例如免费版、专业版等

详情请参见 [FAQ](#is-XU-Git-free-to-use)。

[功能](#discover-powerful-features)
| [实验室](#xutec-labs)
| [Pro](#ready-for-XU-Git-pro)
| [FAQ](#faq)
| [支持和社区](#support-and-community)
| [贡献](#contributing)
| [贡献者](#contributors-)
| [许可证](#license)

- # 发现强大的功能

  快速了解某行或代码块的变更时间、原因以及变更者。聚焦于最重要的变更，轻松浏览历史，深入了解文件或单行代码的演变过程。通过 Git 追溯注释和 Git 代码洞察，一目了然地可视化代码作者。通过视觉丰富的提交图无缝探索 Git 仓库。通过 XU-Git Inspect 获得宝贵的见解，还有更多功能。

  - [**追溯、代码洞察 和悬停**](#blame-代码洞察-and-hovers) — 通过编辑器内的代码注释和丰富的悬停信息，更深入了解代码的变更及变更者。
  - [**文件注释**](#file-annotations) — 按需切换整个文件注释，查看作者、最近的更改和热图。
  - [**修订导航**](#revision-navigation) — 探索文件历史，查看代码随时间的演变。
  - [**侧边栏视图**](#side-bar-views) — 强大的 Git 视图，不在默认提供的功能中。
  - [**提交图 `Pro`**](#commit-graph-pro) — 可视化你的仓库并跟踪所有进行中的工作。
  - [**启动台 `Preview`**](#launchpad-preview) — 保持专注并让你的团队不中断。
  - [**代码建议 `Preview`**](#code-suggest-preview) — 让你的代码评审不再受不必要的限制。
  - [**云补丁 `Preview`**](#cloud-patches-preview) — 轻松且安全地与团队成员分享代码。
  - [**工作树 `Pro`**](#worktrees-pro) — 同时在一个仓库的不同分支上工作。
  - [**可视化文件历史 `Pro`**](#visual-file-history-pro) — 识别文件最重要的变更及变更者。
  - [**XU-Tec 工作区 `Preview`**](#xutec-workspaces-preview) — 轻松分组和管理多个仓库。
  - [**交互式变基编辑器**](#interactive-rebase-editor) — 通过用户友好的编辑器可视化和配置交互式变基操作。
  - [**全面的命令**](#comprehensive-commands) — 丰富的命令集，帮助你完成所有需要的操作。
  - [**集成**](#integrations) — 通过与你的 Git 托管服务的集成，简化工作流程并快速获得见解。

## 追溯、代码洞察 和悬停

通过编辑器内的代码注释和丰富的悬停信息，更深入了解代码的变更及变更者。

### 行内和状态栏追溯

通过当前行末尾和状态栏上的不显眼的**追溯注释**提供有关行更改的历史背景。

💡 在命令面板中使用`切换行追溯`和`切换 Git 代码洞察`命令来开启和关闭注释。

### Git 代码洞察

在每个文件顶部和每个代码块的开头添加上下文和可操作的作者信息。

- **最近更改** — 文件或代码块的最新提交的作者和日期
- **作者** — 文件或代码块的作者数量和最突出的作者（如果有多个）

### 丰富的悬停信息

悬停在追溯注释上可以显示详细信息和操作。

## 文件注释

使用按需的整个文件注释查看作者、最近的更改和热图。注释作为视觉指示器直接在编辑器中渲染。

💡 在一个活动文件上，使用命令面板中的`切换文件追溯`、`切换文件更改`和`切换文件热图`命令来开启和关闭注释。

## 修订导航

只需点击一个按钮，你就可以向前和向后导航任何文件的历史。比较不同时期的更改，查看整个文件或单行的修订历史。

## 侧边栏视图

我们的视图排列有助于集中注意力和提高生产力，但你可以轻松拖动它们以适应你的需求。

💡 使用`重置视图布局`命令快速恢复到默认布局。

### XU-Git 检查

对代码进行透视或开发者工具检查，专注于提供与当前工作相关的上下文信息和见解。

- **检查** &mdash; 查看提交或暂存的详细信息。
- **行历史** &mdash; 跳转到选定行的修订历史。
- **文件历史** &mdash; 探索文件、文件夹或选定行的修订历史。
- [**可视化文件历史 `专业版`**](#visual-file-history-pro) &mdash; 快速查看文件的演变，包括更改时间、更改大小和更改者。
- **搜索与比较** &mdash; 搜索并探索特定提交、消息、作者、更改的文件或特定代码更改，或可视化分支、标签、提交等之间的比较。

### XU-Git

快速访问许多 XU-Git 功能。也是 XU-Tec 团队和协作服务（如 XU-Tec 工作区）、帮助和支持的主页。

- **主页** &mdash; 快速访问许多功能。
- [**云补丁 `预览`**](#cloud-patches-preview) &mdash; 轻松安全地与团队成员分享代码。
- [**XU-Tec 工作区 `预览`**](#xutec-workspaces-preview) &mdash; 轻松分组和管理多个存储库，随时随地访问，简化工作流程。
- **XU-Tec 账户** &mdash; 使用 XU-Tec 云服务增强功能。

### 源代码控制

显示额外的视图，专注于探索和管理你的存储库。

- **提交** &mdash; 当前分支提交历史的综合视图，包括未推送的更改、上游状态、快速比较等。
- **分支** &mdash; 管理和导航分支。
- **远程** &mdash; 管理和导航远程及远程分支。
- **暂存** &mdash; 保存和恢复尚未准备提交的更改。
- **标签** &mdash; 管理和导航标签。
- [**工作树 `专业版`**](#worktrees-pro) &mdash; 同时在存储库的不同分支上工作。
- **贡献者** &mdash; 贡献者的有序列表，提供对个人贡献和参与度的见解。
- **存储库** &mdash; 将上述视图统一起来，更高效地管理多个存储库。

### （底部）面板

便捷且易于访问的提交图，带有专用的详细视图。

- [**提交图 `专业版`**](#commit-graph-pro) &mdash; 可视化你的存储库并跟踪所有进行中的工作。

## 提交图 `专业版`

轻松可视化你的存储库并跟踪所有进行中的工作。

使用丰富的提交搜索找到你需要的内容。其强大的过滤器允许你按特定提交、消息、作者、更改的文件或特定代码更改进行搜索。[了解更多](https://xutec.org/xugit/solutions/commit-graph?utm_source=xu-git-extension&utm_medium=in-app-links)

💡通过`切换提交图`命令快速切换图表。

💡通过`切换最大化提交图`命令最大化图表。

## 启动台 `预览版`

启动台将所有 GitHub 的拉取请求整合到一个统一的、可操作的列表中，以更好地跟踪进行中的工作、待处理的工作、评审等。保持专注，并对最重要的事项采取行动，确保团队的顺利进行。[了解更多](https://xutec.org/xugit/solutions/launchpad?utm_source=xu-git-extension&utm_medium=in-app-links)

## 代码建议 `预览版`

从 GitHub 限制性的、仅评论的反馈方式中解放你的代码评审。就像在 Google 文档上建议更改一样，可以在你已经在编码的地方——你的 IDE 中，建议对项目中的任何内容进行代码更改，而不仅仅是 PR 中更改的代码行。[了解更多](https://xutec.org/xugit/solutions/code-suggest?utm_source=xu-git-extension&utm_medium=in-app-links)

## 云补丁 `预览版`

通过从你的 WIP、提交或暂存中创建云补丁并共享生成的链接，轻松且安全地与团队成员或其他开发人员分享代码更改。使用云补丁来提前协作，获取对方向、方法等的反馈，最小化返工并简化工作流程。[了解更多](https://xutec.org/xugit/solutions/cloud-patches?utm_source=xu-git-extension&utm_medium=in-app-links)

## 工作树 `专业版`

通过最小化在分支之间的上下文切换，高效地进行多任务处理，使你能够轻松同时处理存储库的不同分支。

在需要评审拉取请求时，避免打断当前的工作进程。只需创建一个新的工作树并在一个新的 VS Code 窗口中打开它，而不影响其他工作。

## XU-Tec 工作区 `预览版`

XU-Tec 工作区允许你轻松分组和管理多个存储库，随时随地访问，简化工作流程。为你自己创建工作区或与团队共享（即将在 XU-Git 中推出），以加快入职并改善协作。[了解更多](https://xutec.org/xugit/solutions/workspaces?utm_source=xu-git-extension&utm_medium=in-app-links)

## 可视化文件历史 `专业版`

快速查看文件的演变，包括更改的时间、更改的大小以及更改者。使用它快速找到对文件最有影响的更改时间或最适合谈论文件更改的人等。

## 交互式变基编辑器

使用直观且用户友好的交互式变基编辑器轻松可视化和配置交互式变基操作。只需拖放即可重新排序提交，并选择要编辑、压缩或删除的提交。

## 全面的命令

无需担心记住 Git 命令；XU-Git 提供了一组丰富的命令，帮助你完成所有需要的操作。

### Git 命令面板

一个引导式的、逐步的体验，用于快速且安全地执行 Git 命令。

### 快速访问命令

使用一系列新命令来：

- 探索分支和文件的提交历史
- 快速搜索和导航到（并操作）提交
- 探索某个提交的文件
- 查看并探索你的暂存
- 可视化当前存储库状态

# 集成

上下文切换会降低生产力。XU-Git 不仅揭示存储库中隐藏的知识，还从问题和拉取请求中提供额外的上下文，为你提供触手可得的信息和见解。

通过自动链接多个 Git 托管服务（包括 GitHub、GitHub Enterprise `专业版`、GitLab、GitLab 自托管 `专业版`、Jira、Gitea、Gerrit、Google Source、Bitbucket、Bitbucket Server、Azure DevOps 和自定义服务器）中的问题和拉取请求，简化你的工作流程并快速获得见解。

所有集成都提供自动链接，而与 GitHub、GitLab 和 Jira 的丰富集成则提供详细的悬停信息，包括自动链接的详细信息、拉取请求、分支和提交之间的关联，以及用户头像以增加上下文。

## 定义自己的自动链接

使用自动链接在提交消息中链接外部引用，例如 Jira 问题或 Zendesk 工单。

# XU-Tec 实验室

我们的实验室旨在与社区一起进行实验和探索，以收集早期反馈。以下是我们当前的一些实验。

## 🧪AI 解释提交

使用 **检查** 视图中的解释面板，利用 AI 帮助你理解提交引入的更改。

## 🧪自动生成提交消息

从源代码控制视图的上下文菜单中使用 `生成提交消息` 命令，利用 AI 自动生成阶段性更改的提交消息。

# 准备好使用 XU-Git 专业版了吗？

当你准备好充分利用 XU-Git 和我们的 [Dev 平台](https://xutec.org/xugit/dev?utm_source=xu-git-extension&utm_medium=in-app-links) 并在私有托管存储库上享受所有好处时，请考虑升级到 XU-Git 专业版。使用 XU-Git 专业版，你可以在私有托管存储库上访问 [专业版功能](https://xutec.org/xugit/pro-features?utm_source=xu-git-extension&utm_medium=in-app-links)。

要了解更多关于定价和 XU-Git 专业版提供的附加功能，请访问 [XU-Git 定价页面](https://www.xutec.org/xugit/pricing?utm_source=xu-git-extension&utm_medium=in-app-links)。今天就升级到 XU-Git 专业版，让你的 Git 工作流程更上一层楼！

# 常见问题解答

## XU-Git 可以免费使用吗？

是的。除 `专业版` 功能外，所有功能都可以在所有存储库上免费使用，而 `专业版` 功能需要 [试用或付费计划](https://www.xutec.org/xugit/pricing?utm_source=xu-git-extension&utm_medium=in-app-links)。

虽然 XU-Git 提供了一套显著的免费功能，但部分针对专业开发人员和团队的 `专业版` 功能需要在私有托管存储库上使用试用或付费计划——在本地或公开托管的存储库上使用是对所有人免费的。此外，`预览版` 功能将来可能需要付费计划，如果是云支持的，则需要 XU-Tec 账户。

无需账户即可免费试用 `专业版` 功能 3 天，或开始免费 XU-Git 专业版试用以获得额外 7 天的 `专业版` 功能访问权限，体验 XU-Git 的全部威力。

## `专业版` 和 `预览版` 功能可以免费使用吗？

`专业版` 功能在本地和公开托管的存储库上免费使用，但在私有托管的存储库上需要付费计划。`预览版` 功能将来可能需要付费计划。

## 我在哪里可以找到定价信息？

请访问 [XU-Git 定价页面](https://www.xutec.org/xugit/pricing?utm_source=xu-git-extension&utm_medium=in-app-links) 获取详细的定价信息和计划功能矩阵。

# 支持和社区

支持文档可以在 [XU-Git 帮助中心](https://help.xutec.org/xugit/xugit-home/) 找到。如果你需要进一步的帮助或有任何问题，XU-Git 提供了多种支持渠道和社区论坛：

## 问题报告和功能请求

发现了 bug？有功能请求？请访问我们的 [GitHub 问题页面](https://github.com/xuxuchan/vscode-xuxu-git/issues)。

## 讨论

加入 XU-Git 社区，在 [GitHub 讨论](https://github.com/xuxuchan/vscode-xuxu-git/discussions) 中与其他用户交流，分享你的经验，并讨论与 XU-Git 相关的主题。

## XU-Tec 支持

对于与 XU-Git 相关的任何问题或查询，可以通过 [官方支持页面](https://support.xutec.org/xugit/) 联系 XU-Tec 支持团队。他们将很乐意帮助你解决任何可能遇到的问题。

使用 XU-Git 专业版，你可以获得来自客户成功团队的优先电子邮件支持，确保更高的优先级和更快的响应时间。我们还提供定制的入职和培训，帮助你和你的团队快速启动并运行 XU-Git 专业版计划。

# 贡献

XU-Git 是一个开源项目，极大地受益于社区的贡献和反馈。

你的贡献、反馈和参与在塑造 XU-Git 的未来方面起着重要作用。感谢你的支持！

# 贡献者

特别感谢为该项目做出贡献的人们：

- XUXU ([@xuxu](https://github.com/xuxuchan)) &mdash; [贡献](https://github.com/xuxuchan/vscode-xuxu-git/commits?author=xuxu)

# 许可

此存储库包含 OSS 许可和非 OSS 许可文件。

在任何名为 "plus" 的目录中的所有文件都属于 LICENSE.plus 许可。

其余文件属于 MIT 许可。
