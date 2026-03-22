# Git 工作流（避免丢改动）

`effector-docs` 是独立 Git 仓库；**有提交的改动才会被 Git 记录**，本地磁盘以外还可 `push` 到远程备份。

## 日常（改完文档站相关文件后）

```bash
cd effector-docs
git status
git add -A
git commit -m "简短说明这次改了什么"
```

有远程时定期推送：

```bash
git push origin main
```

## 说明

- **未 `commit` 的修改**只存在于工作区；误删目录、换机器、覆盖文件时可能丢失。
- **`dist/`** 在 `.gitignore` 里，一般只提交源码；发布前本地执行 `npm run build` 即可。

## 父目录 `OpenClawHQ`

根目录**不是**单一 Git 仓库；下面多个子项目（如 `effector-core`、`effector-docs`）**各自**有 `.git`。在哪个项目里改代码，就在**那个目录里** `git commit`。
