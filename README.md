# AI Partner

一款能让聊天记录永远存在的聊天机器人。

## 功能

- **多 AI 提供商**：支持 DeepSeek、OpenAI、Claude
- **长期记忆**：自动提取并存储对话中的关键事实和语义记忆，实现跨会话的上下文感知
- **语义搜索**：基于嵌入向量的记忆检索
- **实时对话**：流式响应的聊天界面

## 技术栈

| 前端 | 后端 |
|------|------|
| Vue 3 + TypeScript | Express + TypeScript |
| Vite | MySQL (mysql2) |

## 快速开始

### 前置要求

- **Node.js** >= 18
- **pnpm**（安装：`npm install -g pnpm`）
- **MySQL** >= 8.0（需要先安装并启动 MySQL 服务）

### 安装

```bash
# 克隆项目
git clone <项目地址>
cd ai-partner

# 安装前端依赖
pnpm install

# 安装后端依赖
cd server && pnpm install && cd ..
```

### 配置

```bash
# 复制环境变量模板
cp server/.env.example server/.env
```

然后编辑 `server/.env`，填入你的 MySQL 配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=friend
PORT=3001
```

### 启动

**后端**（需先确保 MySQL 已运行）：

```bash
cd server
pnpm dev
```

**前端**（新开一个终端）：

```bash
pnpm dev
```

### Windows 注意

如果在 Windows 上用 `pnpm dev` 报错 `sed: command not found` / `uname: command not found`：

1. 先确认 Git Bash 已安装
2. 或者在 PowerShell 中直接运行（绕过脚本解析器）：

```powershell
# 后端
cd server
node .\node_modules\tsx\dist\cli.mjs watch --env-file=.env src\index.ts

# 前端
cd ..
node .\node_modules\vite\bin\vite.js
```

启动后，前端访问 `http://localhost:5173`，后端 API 在 `http://localhost:3001`。

## 项目结构

```text
├── src/                  # 前端源码
│   ├── ai/               # AI 提供商适配
│   ├── api/              # API 客户端
│   ├── components/       # UI 组件
│   ├── composables/      # 组合式函数
│   └── memory/           # 记忆系统
├── server/               # 后端源码
│   ├── src/
│   │   ├── db/           # 数据库连接与迁移
│   │   └── routes/       # API 路由
│   └── .env.example      # 环境变量模板
└── vite.config.ts
```

## License

[MIT](LICENSE)
