# adguard-dns-rules

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

> 一套聚合多源过滤规则、转换为 AdGuard DNS 过滤格式并维护自定义规则的框架，同时提供 AdGuard Home 一键部署方案。

## 概览

adguard-dns-rules 是一个 DNS 过滤规则管理框架，主要功能包括：

1. **聚合多源规则** — 从多个上游源（远程 URL / 本地文件）拉取原始过滤规则
2. **格式转换** — 将各类格式（Shadowrocket 等）的规则转换为 AdGuard DNS 过滤格式（`||domain^`）
3. **自定义规则维护** — 支持维护一套自定义拒绝列表，补充上游规则的不足
4. **一键部署** — 提供 Docker Compose 方案，一键部署 AdGuard Home 并自动订阅本项目生成的规则

## 快速开始

### 已经部署了`AdGuard Home`修改配置并重启

1. 订阅链接
    - https://raw.githubusercontent.com/Code-Agitator/adguard-dns-rules/refs/heads/main/agrules/agh_custom_reject.txt
    - https://raw.githubusercontent.com/Code-Agitator/adguard-dns-rules/refs/heads/main/agrules/agh_sr_reject.txt
2. 中国宝宝体质链接
    - https://jsd.onmicrosoft.cn/gh/Code-Agitator/adguard-dns-rules/agrules/agh_custom_reject.txt
    - https://jsd.onmicrosoft.cn/gh/Code-Agitator/adguard-dns-rules/agrules/agh_sr_reject.txt

### 第一次部署`AdGuard Home`

1. 一行命令一键部署：

```bash
curl -fsSL https://raw.githubusercontent.com/Code-Agitator/adguard-dns-rules/refs/heads/main/deployment/build.sh | bash
```

2. 适配中国宝宝体质

```bash
curl -fsSL https://jsd.onmicrosoft.cn/gh/Code-Agitator/adguard-dns-rules/deployment/build.sh | bash -s -- --cn
```

部署后访问 `http://localhost:3000` 进入 AdGuard Home 管理面板。

**项目结构：**

```
.
├── sources/                  # 源配置（YAML 格式，定义过滤源与转换器）
│   └── shadowrocket.yaml
├── rules/                    # 自定义规则文件（原始格式）
│   └── custom_reject_list.module
├── agrules/                  # 输出的 AdGuard 格式规则文件
│   ├── agh_custom_reject.txt
│   └── agh_sr_reject.txt
├── src/                      # TypeScript 源码
│   ├── index.ts              # 构建入口
│   ├── types.ts              # 类型定义
│   ├── lib/
│   │   ├── fetcher.ts        # 远程拉取 / 本地读取
│   │   ├── merger.ts         # 规则合并
│   │   └── deduplicator.ts   # 去重
│   ├── converters/           # 格式转换器
│   │   ├── index.ts
│   │   └── shadowrocket.ts   # Shadowrocket → AdGuard 转换
│   └── sources/
│       └── loader.ts         # YAML 源配置加载
├── deployment/               # AdGuard Home 部署配置
│   ├── docker-compose.yml
│   ├── docker-compose.gitee.yml
│   ├── conf/                 # GitHub 源 AdGuardHome.yaml
│   └── conf-gitee/           # Gitee 源 AdGuardHome.yaml
├── .github/workflows/build.yml  # CI/CD 自动构建
├── package.json
└── tsconfig.json
```

## 核心功能

### 1. 规则聚合与转换

通过 `sources/*.yaml` 配置文件定义数据源，每个源可指定：

- **远程 URL** — 从 GitHub 等远程仓库拉取规则文件
- **本地路径** — 读取本地自定义规则文件
- **转换器** — 指定格式转换逻辑（如 `shadowrocket`）

运行构建：

```bash
npm run build
```

构建流程：

1. 加载所有源配置
2. 逐个获取原始规则（远程拉取 / 本地读取）
3. 使用对应转换器将规则转为 AdGuard DNS 格式
4. 输出到 `agrules/` 目录

### 2. 自定义规则

`rules/custom_reject_list.module` 维护了一套自定义拒绝列表，涵盖国内常用应用的广告/追踪域名（如墨迹天气、微信小程序、彩云天气、中国电信等）。这些规则在转换后被输出为
AdGuard 格式的 `agh_custom_reject.txt`，可直接订阅。

### 3. 部署 AdGuard Home

项目提供 Docker Compose 一键部署方案，自动订阅本项目生成的规则：

```bash
cd deployment
docker compose up -d
```

访问 `http://localhost:3000` 即可进入 AdGuard Home 管理面板。

**配置文件**：

- `deployment/conf/AdGuardHome.yaml` — GitHub 源（自动拉取规则）
- `deployment/conf-cn/AdGuardHome.yaml` — 适合中国宝宝体质（国内加速）

两个配置均已预配置好过滤器订阅地址，开箱即用。

## 构建与开发

### 前提条件

- Node.js 20+
- npm

### 安装与运行

```bash
npm install
npm run build    # 编译并运行，生成 agrules/
```

## 源配置格式

`sources/*.yaml` 使用简单 YAML 格式：

```yaml
format: shadowrocket          # 转换器类型
sources:
  - name: shadowrocket-rules  # 源名称
    url: https://...          # 远程地址（可选）
    output: agh_sr_reject.txt # 输出文件名
  - name: custom-rules
    path: rules/custom_reject_list.module  # 本地路径（可选）
    output: agh_custom_reject.txt
```

## 转换器

当前支持 `shadowrocket` 转换器，将 Shadowrocket 格式的规则转换为 AdGuard DNS 过滤语法：

| Shadowrocket 类型          | AdGuard 格式           |
|----------------------------|------------------------|
| `DOMAIN-KEYWORD`           | 原样保留（子串匹配）   |
| `DOMAIN` / `DOMAIN-SUFFIX` | `\|\|domain^`          |
| `IP-CIDR`                  | 跳过（DNS 层无法拦截） |

## 许可证

本项目基于 [GNU General Public License v3.0](LICENSE) 发布。
