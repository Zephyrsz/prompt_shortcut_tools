# PromptKit 本地数据库与 D1 数据迁移审查

审查日期：2026-10-11。

结论：当前 PromptKit 是通过 HTTP API 访问后端的 SwiftUI 原型，尚未实现本地数据库、离线读写、D1 数据导入或 iCloud 同步。用户进一步明确的目标是 **iPhone 本地持久化**。保留当前 iOS 15 支持，并希望直接管理现有关系表时，推荐 **SQLite + GRDB**；若提高最低版本到 iOS 17、以 SwiftUI 集成为优先，则可优先采用 **SwiftData**；保留 iOS 15 且希望由 Apple 框架管理实体时，可采用 **Core Data**。

**已确认的本地存储目标**

iOS App 可以在自身沙盒的 Application Support 目录中创建和读写 `PromptKit.sqlite` 文件。模板、标签、收藏和变量数据都保存在 iPhone 本地，关闭并重新打开 App 后仍然存在，日常增删改查可以离线完成。SQLite 不需要独立数据库服务器；GRDB 是 App 内访问 SQLite 的 Swift 库。

初始数据有两种方式：首次启动创建空库，或随 App 安装包携带预置 SQLite 文件，首次启动复制到可写的 Application Support 目录后再使用。安装包中的文件用于初始化，后续升级不能重新复制并覆盖用户已有数据库。卸载 App 通常会删除沙盒数据，因此用户需要导出备份或通过系统备份恢复。

SwiftData 与 Core Data 也可以只做本地存储，默认持久化通常采用 SQLite；选择这些框架并不要求开启 iCloud。D1 在当前需求中仅是已有数据的迁移来源。本报告后文的远程同步与 CloudKit 内容是未来可选扩展，不是实现本地存储的前提。

**审查范围与依据**

读取了当前工作区的 PromptKit 源码，并对照远程分支 `codex/cloudflare-d1` 的提交 `2ec0cb553b778cc5284a7f821d47d4f8919f909d`。已通过远程引用查询确认该提交与远程分支一致。当前工作区在 `main`，PromptKit 尚未被 Git 跟踪，因此审查 D1 代码时直接读取分支对象，没有切换当前工作区。

检查的数据源包括当前 `prisma/prompts.db` 与 D1 分支提交中的数据库快照；两者以下统计一致。**这些是仓库快照，不代表线上 D1 的实时内容。** 本次没有读取线上数据库，也没有执行生产迁移。

| 检查项 | 结果 | 迁移含义 |
|---|---:|---|
| Prompt | 27 条 | 完整保留所有字段，不能只导入被标记为模板的记录 |
| Tag | 14 条 | 保留原始名称、颜色和远程 ID |
| 标记为模板的 Prompt | 13 条 | 不应在编辑时统一改为模板 |
| 含 `${...}` 占位符的 Prompt | 14 条 | 占位符存在与 `isTemplate` 并不完全一致 |
| 含 `{{...}}` 占位符的 Prompt | 0 条 | iOS 当前替换语法不能直接处理已有模板 |
| 非空 description | 10 条 | 编辑与导出必须保留这些描述 |
| Prompt 最大 ID / Tag 最大 ID | 43 / 45 | ID 有空洞，不能按数组位置重新编号 |
| createdAt / updatedAt | 全部为 SQLite integer | 当前数据保存 Unix 毫秒时间戳 |
| tags / templateVars JSON | 均可解析为字符串数组 | 原始 SQL 行需要解 JSON，HTTP API 已解 JSON |
| 缺失标签引用 | 8 处，涉及 7 个不同名称 | 不能通过 JOIN 静默丢掉这些名称 |
| 标签颜色 | 14 条均为 `bg-...` 样式名 | 需要映射为 iOS 可用颜色，而不是当作 HEX 解析 |
| SQLite quick_check | ok | 两份快照的数据库完整性检查通过 |

**现有设计合理的部分与需要修正的部分**

SwiftUI 页面与 APIService、DataStore 的初步分层合理；Prompt、Tag 的业务字段也基本覆盖了 Web 模型。但 DataStore 同时承担网络请求、界面状态和数据操作，并且直接依赖单例 APIService，尚未形成独立、可注入的本地 Repository。要支持离线和迁移，需要让持久化数据库成为界面查询的数据来源。

目前的数据路径是 `View → DataStore → APIService → 后端数据库`；建议改为 `View → ViewModel → Repository → SQLite`。ImportService 负责外部数据转换与入库；如果以后保留 Web/App 双向同步，再由 SyncService 通过 Worker API 与 D1 交换数据。

| 优先级 | 已确认问题 | 影响与证据 |
|---|---|---|
| P1 | 没有本地持久化 | [DataStore.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Services/DataStore.swift:8) 只有内存数组，所有增删改查都调用 APIService。关闭 App 后，下次启动需要重新联网取数。 |
| P1 | 编辑接口与 D1 分支不匹配 | [APIService.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Services/APIService.swift:54) 用 `PUT /prompts/:id` 提交完整编辑内容；D1 的该 PUT 只处理收藏，正文更新应使用 PATCH。对实际路由的隔离调用确认 PUT 返回 200，但标题和正文保持旧值。 |
| P1 | 时间解析会篡改历史时间 | [Prompt.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Models/Prompt.swift:32) 与 [Tag.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Models/Tag.swift:25) 只尝试带小数秒的 ISO 字符串；D1 返回的毫秒整数会落入 `Date()`。实际 Swift 复现确认该行为。 |
| P1 | 删除请求忽略 HTTP 失败 | [APIService.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Services/APIService.swift:124) 丢弃 response。D1 拒绝删除仍被使用的标签并返回 400 时，[DataStore.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Services/DataStore.swift:99) 仍会从内存中移除该标签。实际 APIService 在模拟 HTTP 400 响应下正常返回。 |
| P1 | 模板语法不兼容 | Web 使用 `${variable}`；[VariableInputView.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Views/VariableInputView.swift:91) 插入 `{{variable}}`，[PromptDetailView.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Views/PromptDetailView.swift:240) 也只替换后者。已有 D1 模板即使入库，仍不能直接使用。 |
| P1 | 颜色字段语义不兼容 | D1 的 `Tag.color` 存 `bg-teal-500` 等 Web 样式名；[Tag.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Models/Tag.swift:11) 按 HEX 处理。这些值会进入当前颜色转换器的默认黑色分支。 |
| P2 | 编辑负载重置已有属性 | [EditPromptView.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Views/EditPromptView.swift:270) 固定提交 `isFavorite: false`、`isTemplate: true`。换成正确的 PATCH 后，普通编辑仍会取消收藏并把普通 Prompt 改成模板。应只提交变更字段或保留原值。 |
| P2 | 导入、导出、iCloud 均未实现 | [TemplateListView.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Views/TemplateListView.swift:112) 导入是 TODO；[SettingsView.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Views/SettingsView.swift:379) 导出只关闭页面，iCloud 开关只绑定临时 `@State`。 |
| P2 | 详情页使用旧值快照 | [PromptDetailView.swift](/Users/rgwei/pj/pj_my/prompt_shortcut_tools/PromptKit/Views/PromptDetailView.swift:7) 持有 `let prompt`，DataStore 替换记录后详情仍可能显示旧收藏或正文；详情应按 ID 观察 Repository 的最新记录。 |

此外，API 地址写死为 `http://127.0.0.1:3001/api`；真机中的回环地址指向手机本身，接入 D1 部署时需要使用可配置的 Worker HTTPS 地址。读取失败目前只记录 errorMessage，页面没有展示该错误，空列表可能被误认为没有数据。

还有一个备份格式隐患：Prompt 自定义了 Date 解码，但沿用了默认 Date 编码。实测 `JSONEncoder → JSONDecoder` 往返不能保留 createdAt。未来的备份文件必须采用明确、对称的时间编码规则，不能直接默认编码当前模型。

**数据库选型**

SQLite 是数据库引擎，GRDB 是 Swift 对 SQLite 的访问与迁移库；两者共同构成推荐方案。D1 使用 SQLite 语义，现有业务表和字段很适合迁移到嵌入式 SQLite，但 D1 云端服务本身不能在 iPhone 上运行。

| 方案 | 与当前项目的适配 | 适合的产品方向 |
|---|---|---|
| **SQLite + GRDB** | 可保留熟悉的 SQL、事务、唯一约束和索引；方便显式处理 D1 导入和 schema 迁移。所查 GRDB Package 声明最低 iOS 13，符合项目 iOS 15 目标；具体版本须匹配 Xcode/Swift 工具链。 | 本地离线使用，需要直接控制关系表、SQL 与迁移 |
| **Core Data** | 可支持 iOS 15，由 Apple 框架管理本地实体和持久化；D1 行需要转换为实体，不能把 D1/普通 SQLite 文件直接作为 Core Data store 打开。CloudKit 可选。 | 保留旧系统支持，希望使用成熟的 Apple 持久化框架 |
| **SwiftData** | SwiftUI 集成方便，可完全本地使用，但要求 iOS 17+；仍需要专门的 D1 导入适配。 | 提高最低系统版本后，以 SwiftUI 开发效率为优先 |
| 直接调用 sqlite3 | 数据兼容，但需要自行处理语句绑定、迁移、并发和查询观察。 | 有明确理由控制底层实现时；本项目不必承担这些额外工作 |

UserDefaults 适合保存外观、语言、同步开关等偏好，不适合作为 Prompt/Tag 的主要存储。当前规模很小，数据库性能不是决定因素；数据完整性、迁移可控性和同步目标更重要。

GRDB 不会自动提供 CloudKit 同步。若 iCloud 是必须兑现的首要能力，应直接选择 Core Data + CloudKit，并把 D1 作为导入来源；若继续支持 D1，则先建立本地 SQLite 与 D1 的同步协议。不要让 D1 与 CloudKit 同时无规则地覆盖同一批记录。

**建议的本地模型**

业务数据先建三张表：`prompts`、`tags`、`prompt_tags`；另用 `import_runs` 记录已完成导入的来源与快照。Swift 层分开定义网络 DTO、本地持久化记录和界面使用的模型，避免 API 的兼容规则污染数据库模型。

| 字段或关系 | 建议设计 |
|---|---|
| 本地主键 | UUID；新离线记录自行生成，已导入记录使用稳定映射或保存完整映射表 |
| 原 D1 整数 id | 保存为可空 `remote_id`，不作为跨设备统一的本地主键 |
| 来源范围 | 用稳定 `library_id/source_instance_id` 标识同一个数据集；唯一约束为 `(library_id, remote_id)`。域名变化不应制造一个新数据源。 |
| Prompt 原字段 | 保留 title、description、promptText、usageNotes、isFavorite、isTemplate、templateVars 与历史时间，不按 iOS 当前 UI 能否编辑来删字段 |
| 时间 | `created_at_ms / updated_at_ms` 使用 Unix 毫秒整数；API 和备份明确同一单位 |
| 标签关系 | `prompt_tags(prompt_id, tag_id, position)`，保存原始顺序；用外键保证引用存在 |
| 标签名称 | 保留原始名称；按资料库建立名称唯一约束，避免不同库之间错误合并 |
| 标签颜色 | 显示使用规范颜色值，同时保留 `legacy_color`，以兼容仍使用 Web 样式名的 D1 版本 |
| 缺失标签 | 补建 `is_placeholder = true` 的本地记录，保留名称；不自动把占位标签上传到 D1 |
| 模板变量 | 保留原始正文和变量列表；提取规则与渲染规则作为独立模块，兼容现有 `${...}` 与 iOS `{{...}}` |
| 导入记录 | 来源、快照 ID/内容校验值、完成时间、原始数量、补建标签数量；只在事务成功后记为完成 |

若只在一个空本地库中导入一次，也可以沿用整数主键；推荐 UUID + remote_id 是为了后续离线创建、多个资料库和设备之间避免 ID 冲突，并非因为 SQLite 不能使用整数。

数据库文件放在 Application Support，使用版本化的 GRDB DatabaseMigrator；不要放在可能被系统清理的 Caches，也不要在升级失败时删除用户数据库。初期可使用单个 DatabaseQueue，查询与导入避免阻塞主线程，只有界面状态发布回到主线程。数据库成为唯一查询来源后，列表、收藏和详情观察数据库变化。

现有数据量无需立即引入全文检索。先使用普通查询与关系索引；增长后再评估 FTS5，并单独验证中文分词和子串搜索效果。

**D1 数据如何迁移到 iOS**

项目现有 `scripts/export-sqlite-to-d1.ts` 的方向是 **仓库 SQLite → D1**，不包含 D1 → App，也不包含持续同步。应新增独立的导入流程，而不是把这个脚本或 README 的历史计数当成 iOS 迁移功能。

推荐的产品路径是 `D1 → Worker 导出快照 → 版本化 JSON → ImportService → 本地 SQLite`。App 通过业务 API 接收数据，不携带用于管理 Cloudflare 数据库的账号凭据。

1. **确认权威数据源。** 如果 Web 已在 D1 上使用，首次导入以线上 D1 的实际内容为准，不能用仓库 `prisma/prompts.db` 替代最新数据。为迁移留存可恢复的导出文件。
2. **取得完整且一致的快照。** 小规模可以先使用现有 `GET /api/tags`、`GET /api/prompts`，但两个独立请求不是一个原子快照；导出期间应暂停写入，或新增在服务器侧生成一致快照的导出接口。后续分页需绑定快照 ID，避免翻页时数据变化。
3. **定义可版本化的交换格式。** 至少包含 schemaVersion、稳定 sourceInstanceId、snapshotId、导出时间、原始行数、prompts、tags；备份采用明确的毫秒时间编码。内容校验值由规范化序列化结果生成，用于验证和识别重复导入。
4. **先解析和校验，再入库。** HTTP 返回的 tags/templateVars 已是数组；从 SQL/SQLite 读出的则是 JSON 字符串。布尔值从 SQL 0/1 转为 Bool。时间接受当前来源的毫秒整数；兼容历史文本时明确其格式与 UTC 语义，解析失败应报出问题行，不能用“当前时间”替换。
5. **转换平台差异。** Web 颜色样式名通过版本化色板映射为 iOS 颜色，并保留原 token。保留原正文，先让 iOS 识别 `${...}`，同时兼容已有 `{{...}}`。不要对所有花括号做无条件替换；Web 当前变量正则只支持 ASCII 标识符，中文变量需要两端统一规则。
6. **建立稳定 ID 与标签映射。** 保留 remote_id；先导入已有标签，再导入 Prompt 和关系。缺失标签建立有标记的占位记录。重复标签名称按明确规则处理，不能静默改名或丢弃引用。
7. **原子提交。** 同一事务写入业务数据、关系和 import_runs。校验失败回滚；初次导入记录作为已同步的基线，而非待上传的新建记录。对非空资料库，默认按来源导入独立资料库或只新增未映射记录；重复导入不能覆盖用户在本地的新修改。
8. **验收并形成导入报告。** 校验原始 Prompt 数量、远程 ID 映射、时间、正文、可空字段、变量、标签关系与外键；确认重启后仍存在、断网可查询、重复导入不增加记录。源标签数与补建占位标签数分别报告。

对当前仓库快照，这一规则的预期是 **27 条 Prompt、14 条原始标签、7 条占位标签、32 条标签关系**。新增的 7 条占位标签是为了保留原有 8 处缺失引用，不意味着 D1 原来有 21 条标签。

开发者批量搬运也可走 `Wrangler 导出 D1 SQL → 在临时 SQLite 中恢复 → 只读取 Prompt/Tag → 转为同一 JSON 格式 → App 导入`。导出得到的是 SQL 文件，不是可直接打开的 iOS 数据库文件。不要把远程管理流程嵌入 App；也不要把 Core Data/SwiftData 的底层 SQLite 文件当作通用业务表格式使用。

现有导出脚本采用 INSERT OR REPLACE。这个行为适合其原有单次迁移场景，但不适合直接应用到有外键和本地用户改动的新库；本地应采用有明确字段策略的 upsert。备份 SQLite 文件时还要考虑 WAL，使用数据库备份机制或关闭后的完整快照，避免仅复制主文件丢失尚未合并的写入。

**一次性导入与长期同步是两项不同工作**

如果目标只是“把现有 D1 数据带到本地使用”，上述导入即可，后续用版本化 JSON 实现备份恢复。Schema 升级、数据导入、设备同步应由不同的组件管理。

如果 Web 和 App 需要继续共同编辑，仅增加本地数据库不够。当前 D1 schema 只有业务字段、整数 ID 和时间戳，没有版本、变更游标、删除标记或离线创建幂等键，需要追加同步协议：

- 本地修改与 outbox 任务在同一事务提交；用户可以立即看到本地已保存的数据，联网后重试发送。
- 离线创建带稳定 client_uid/幂等键，并由服务端去重，避免“服务端已创建但响应丢失”后的重复记录。
- 服务端维护 revision 与单调 change_seq/cursor；更新携带 baseRevision，冲突时保留本地版本或冲突副本。不要只用手机时间判断覆盖顺序。
- 删除用 tombstone 或变更日志向其他设备传播；否则已有物理 DELETE 后，客户端无法仅靠 updatedAt 增量查询得知记录被删除。
- 拉取与游标推进原子提交，不覆盖仍有未上传修改的记录；标签名称唯一冲突和占位标签上传需有明确合并规则。
- 当前数据模型没有用户或租户字段，按单人资料库设计可以继续使用；扩展多人访问时，需要在服务端确定身份与数据集范围。

“定时 GET 全部数据，再替换 DataStore.prompts”只能作为全量刷新，无法提供可靠的离线双向同步，也可能丢失本地修改。

**建议实施顺序**

第一阶段先修正 API 合同、时间解码和变量语法，HTTP 操作统一检查状态码，编辑只更新需要修改的字段。第二阶段引入 Repository 与 SQLite/GRDB，使增删改查、搜索和收藏可以离线持久化，并按 ID 更新详情。第三阶段实现版本化 JSON 导入导出、来源映射、占位标签与事务回滚。第四阶段根据产品决定实现 D1 同步，或采用 Core Data + CloudKit 的 Apple 同步路线。

如果现在就确定选择 Core Data + CloudKit，直接在第二阶段落地该方案，无需先实现一套 GRDB 再整体改写。

**本次验证结果与边界**

- 用项目原始 Prompt.swift 在临时 Swift 程序中复现：毫秒整数、无小数秒的 ISO 文本、SQLite 时间文本均回退到当前时间；带小数秒 ISO 正常；默认 Codable 日期往返失败。
- 用项目原始 APIService 和模拟 HTTP 响应复现：deleteTag 在 HTTP 400 时正常返回；没有连接真实服务执行删除。
- 对 D1 分支实际 PUT/PATCH 路由做隔离调用，模拟其 service 边界：PUT 忽略正文编辑，PATCH 才传递完整编辑内容。此验证没有调用生产 D1。
- 对两份仓库 SQLite 快照只读检查：27 条 Prompt、14 条 Tag，JSON 有效，时间为整数，存在 8 处缺失标签引用，quick_check 为 ok。
- 在内存 SQLite 中验证转换方案：27 条 Prompt 的原字段和标签顺序保留；产生 21 条标签及 32 条关系；重复执行后数量不变；无外键违例；模拟外键失败时整个事务回滚。颜色转换使用显式示例映射，尚未做两端色板的视觉验收。这是迁移可行性验证，**不是已经实现的 App 导入功能**。
- 目录没有 Xcode 工程或 Swift Package 工程文件，且当前环境只有 Command Line Tools，因此没有声称 iOS 整体构建、真机或界面验证通过。

本次只新增此审查文档，没有修改 App 业务代码或原数据库。

**参考依据**

- [D1 初始 schema（所审查提交）](https://github.com/Zephyrsz/prompt_shortcut_tools/blob/2ec0cb553b778cc5284a7f821d47d4f8919f909d/prisma/d1-migrations/0001_initial.sql)
- [D1 Prompt Repository（时间与 JSON 返回规则）](https://github.com/Zephyrsz/prompt_shortcut_tools/blob/2ec0cb553b778cc5284a7f821d47d4f8919f909d/src/lib/repositories/promptRepository.ts)
- [D1 PUT/PATCH 路由](https://github.com/Zephyrsz/prompt_shortcut_tools/blob/2ec0cb553b778cc5284a7f821d47d4f8919f909d/src/app/api/prompts/%5Bid%5D/route.ts)
- [现有 SQLite → D1 导出脚本](https://github.com/Zephyrsz/prompt_shortcut_tools/blob/2ec0cb553b778cc5284a7f821d47d4f8919f909d/scripts/export-sqlite-to-d1.ts)
- [GRDB Package 平台与工具链要求](https://github.com/groue/GRDB.swift/blob/master/Package.swift)
- [Apple SwiftData（最低 iOS 17）](https://developer.apple.com/documentation/swiftdata)
- [Apple：Mirroring a Core Data store with CloudKit](https://developer.apple.com/documentation/coredata/mirroring-a-core-data-store-with-cloudkit)
