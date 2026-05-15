# -

一款能让聊天记录永远存在的聊天机器人

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

- Node.js >= 18
- pnpm
- MySQL >= 8.0

### 安装

```bash
# 安装前端依赖
pnpm install

# 安装后端依赖
cd server && pnpm install && cd ..
```

### 配置

创建 `server/.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=friend
PORT=3001
```

### 运行

```bash
# 启动后端
cd server && pnpm dev

# 启动前端（新终端）
pnpm dev
```

前端运行在 `http://localhost:5173`，后端 API 在 `http://localhost:3001`。

## 项目结构

```
├── src/                  # 前端源码
│   ├── ai/               # AI 提供商适配
│   ├── api/              # API 客户端
│   ├── components/       # UI 组件
│   ├── composables/      # 组合式函数
│   └── memory/           # 记忆系统
├── server/               # 后端源码
│   └── src/
│       ├── db/           # 数据库连接与迁移
│       └── routes/       # API 路由
└── vite.config.ts
```

## 构建

```bash
# 构建前端
pnpm build
```

## License

[MIT](LICENSE)
