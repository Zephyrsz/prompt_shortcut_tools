# Cloudflare Workers + D1 部署

本项目使用 OpenNext 将 Next.js 部署为 Cloudflare Worker，使用 D1 保存 `Prompt` 和 `Tag` 数据。运行时绑定名固定为 `DB`，API repository 通过 Cloudflare D1 参数化 SQL 访问数据库。Prisma schema 仍用于本地 schema 管理和 SQLite 数据导出，不会在 Worker 请求中加载本地 SQLite 文件。

## 前置条件

- Node.js 20 或更高版本
- 一个已登录并有 Workers/D1 权限的 Cloudflare 账号
- 项目依赖已安装：

```bash
npm install
```

## 1. 创建 D1 数据库

### Wrangler CLI

```bash
npx wrangler login
npx wrangler d1 create prompt-shortcut-tools-db
```

命令会输出类似下面的配置：

```text
[[d1_databases]]
binding = "DB"
database_name = "prompt-shortcut-tools-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

将返回的 `database_id` 替换 `wrangler.jsonc` 中的全零占位值。数据库 ID 不是密钥；不要把 Cloudflare API token 写进仓库。

### Cloudflare 控制台

1. 打开 Cloudflare Dashboard。
2. 进入 **Workers & Pages → D1 SQL database**（部分账号显示为 **Storage & Databases → D1**）。
3. 点击 **Create database**，名称填 `prompt-shortcut-tools-db`，选择离用户较近的区域。
4. 创建后打开数据库详情，复制 Database ID，填入 `wrangler.jsonc` 的 `database_id`。

## 2. 应用表结构迁移

D1 migration 位于 `prisma/d1-migrations/0001_initial.sql`，只创建表和唯一索引，不会覆盖数据：

```bash
npm run db:d1:migrate:remote
```

首次验证可以使用本地 D1 模拟器：

```bash
npm run db:d1:migrate:local
```

## 3. 导入现有 SQLite 数据

仓库中的 `prisma/prompts.db` 是导出源。脚本会保留原始整数 ID、JSON 字段和时间戳，当前快照应输出 27 条提示词和 14 个标签：

```bash
npm run db:export -- --output .tmp/d1-data.sql
head -5 .tmp/d1-data.sql
grep -c 'INSERT OR REPLACE INTO "Prompt"' .tmp/d1-data.sql
grep -c 'INSERT OR REPLACE INTO "Tag"' .tmp/d1-data.sql
```

确认内容后导入远程 D1：

```bash
npm run db:d1:import:remote
```

本地 D1 导入使用：

```bash
npm run db:d1:import:local
```

导入脚本使用 `INSERT OR REPLACE`，可在同一数据库上重复执行。它只写入已导出的行，不会删除 D1 中其他数据；如果需要严格镜像，请先在 D1 控制台或通过 SQL 清理目标表。

## 4. 构建、预览和部署

生成 Worker：

```bash
npm run cf:build
```

使用 Wrangler 在本地预览生产构建（会使用本地 D1 binding）：

```bash
npm run cf:preview
```

部署到 Cloudflare Workers：

```bash
npm run cf:deploy
```

部署完成后，Wrangler 会输出 Worker URL。自定义域名可以在 Cloudflare Dashboard 的 Worker **Settings → Domains & Routes** 中绑定。

## 常用检查

```bash
npm test
npm run lint
npx tsc --noEmit
npx wrangler d1 execute prompt-shortcut-tools-db --remote --command 'SELECT COUNT(*) AS prompts FROM Prompt; SELECT COUNT(*) AS tags FROM Tag;'
```

`npm run dev` 仍然适合做不依赖 API 的 Next.js UI 开发；要验证 D1 binding 和生产 Worker 行为，请使用 `npm run cf:build` 后的 `npm run cf:preview`。不要在生产部署中依赖 `prisma/prompts.db`，Worker 文件系统不是持久化存储。
