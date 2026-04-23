# Ankiniki CLI — ハンズオンガイド

ターミナルから Anki フラッシュカードを作成・学習・管理するための `ankiniki` CLIツール実践ガイドです。

> **English version:** [English guide here](../../../user-guides/cli/README.md)

---

## 事前準備

CLI を使用する前に以下が必要です。

1. **Anki デスクトップアプリ**が起動していること
2. **AnkiConnect アドオン**が Anki にインストールされていること（コード: `2055492159`）
   - Anki → ツール → アドオン → アドオンを取得 → コードを入力
3. **Ankiniki バックエンドサーバー**が起動していること（`note import` / `note generate` で必要）
   ```bash
   # プロジェクトルートから
   npm run dev --workspace=@ankiniki/backend
   # サーバーが http://localhost:3001 で起動します
   ```

---

## インストール

```bash
# プロジェクトルートから CLI をビルド
npm run build --workspace=@ankiniki/cli

# ビルドなしで直接実行（開発モード）
cd apps/cli
npm run dev -- <コマンド>

# ビルド後に実行
node apps/cli/dist/index.js <コマンド>
```

---

## クイックスタート

```bash
# 接続確認
ankiniki status
ankiniki config --show

# はじめてのカードを追加
ankiniki note add "My Deck" "クロージャとは？" "外側のスコープの変数を参照する関数"

# デッキ内のカードを表示
ankiniki note list "My Deck"

# デッキを学習する
ankiniki study "My Deck"
```

---

## コマンド概要

コマンドは **`note`**（カード操作）と **`deck`**（デッキ管理）の2グループと、単独のユーティリティコマンドに分かれています。

```
ankiniki note add        カードを作成
ankiniki note list       デッキ内のカードを一覧表示
ankiniki note edit       $EDITOR でカードを編集
ankiniki note delete     Note ID でカードを削除
ankiniki note generate   AI でファイルまたは stdin からカードを生成
ankiniki note import     CSV / JSON / Markdown から一括インポート
ankiniki note tag        マッチしたノートのタグを一括追加・削除

ankiniki deck list       デッキ一覧（カード数つき）
ankiniki deck create     デッキを作成
ankiniki deck delete     デッキとカードを削除

ankiniki export          デッキを .apkg / CSV / JSON でエクスポート
ankiniki bundle          Anki 不要で .apkg をオフライン作成
ankiniki study           ターミナルで学習セッション
ankiniki stats           レビュー統計ダッシュボード
ankiniki sync            AnkiWeb 同期を実行
ankiniki status          Anki・バックエンドの接続確認
ankiniki config          設定管理
```

---

## `note add` — フラッシュカードを作成

```bash
ankiniki note add [デッキ名] [表面] [裏面]
```

**使用例:**

```bash
# 引数で直接指定（最速）
ankiniki note add "JavaScript" "ホイスティングとは？" "宣言をスコープの先頭に移動する動作"

# タグとモデルを指定
ankiniki note add "Rust" "所有権とは？" "各値には必ず1つの所有者がある" \
  --tags "rust,memory,ownership" \
  --model "Basic"

# デフォルトデッキを使用（config で設定済みの場合）
ankiniki note add "モナドとは？" "自己関手の圏におけるモノイド対象"

# インタラクティブモード — すべてを対話形式で入力
ankiniki note add --interactive
ankiniki note add -i
```

| オプション        | 短縮形 | 説明                              |
| ----------------- | ------ | --------------------------------- |
| `--tags <tags>`   | `-t`   | タグ（カンマ区切り）              |
| `--model <model>` | `-m`   | カードモデル（デフォルト: Basic） |
| `--interactive`   | `-i`   | 対話形式で入力                    |

---

## `note list` — デッキ内のカードを表示

```bash
ankiniki note list <デッキ名> [--limit <n>]
```

**使用例:**

```bash
ankiniki note list "JavaScript"
ankiniki note list "JavaScript" --limit 50
```

| オプション    | 短縮形 | 説明                           |
| ------------- | ------ | ------------------------------ |
| `--limit <n>` | `-l`   | 表示件数上限（デフォルト: 10） |

---

## `note edit` — カードを編集

クエリでノートを検索し、一覧から選んで `$EDITOR` でフィールドを編集します。

```bash
ankiniki note edit <クエリ> [--deck <デッキ名>] [--limit <n>]
```

**使用例:**

```bash
ankiniki note edit "ホイスティング"
ankiniki note edit "tag:js" --deck "JavaScript"
ankiniki note edit "added:1" --limit 5
```

---

## `note delete` — カードを削除

```bash
ankiniki note delete <noteId> [--force]
```

Note ID は `ankiniki note list <デッキ>` で確認できます。

```bash
ankiniki note list "JavaScript"
# → 1. Card ID: 1700000001
#      Front: ホイスティングとは？

ankiniki note delete 1700000001
ankiniki note delete 1700000001 --force   # 確認をスキップ
```

---

## `note generate` — AI でカードを生成

ファイルまたはパイプ経由のコンテンツから AI バックエンドを使ってカードを生成します。

```bash
ankiniki note generate <ファイル>   [オプション]
ankiniki note generate --stdin      [オプション]
```

**使用例:**

```bash
# ファイルから生成（拡張子からコンテンツタイプを自動判別）
ankiniki note generate README.md --deck "Docs"
ankiniki note generate src/auth.ts --deck "Code" --lang typescript

# stdin から読み込む
cat CHANGELOG.md | ankiniki note generate --stdin --deck "Releases"
git diff HEAD~1 | ankiniki note generate --stdin --content-type code --deck "Review"

# 確認なしで全カードを追加
ankiniki note generate README.md --deck "Docs" --yes
```

| オプション              | 短縮形 | 説明                                           |
| ----------------------- | ------ | ---------------------------------------------- |
| `--stdin`               |        | stdin からコンテンツを読み込む                 |
| `--deck <deck>`         | `-d`   | 対象デッキ                                     |
| `--content-type <type>` | `-t`   | `code` / `markdown` / `text`（自動判別）       |
| `--difficulty <level>`  |        | `beginner` / `intermediate` / `advanced`       |
| `--max-cards <n>`       | `-n`   | 生成する最大カード数（デフォルト: 5）          |
| `--lang <language>`     |        | プログラミング言語のヒント（コードファイル用） |
| `--tags <tags>`         |        | 追加タグ（カンマ区切り）                       |
| `--yes`                 | `-y`   | 確認なしで全カードを追加                       |

---

## `note import` — ファイルから一括インポート

**ファイル拡張子から形式が自動判別されます**（`.csv`, `.json`, `.md`）。

```bash
ankiniki note import <ファイル> [オプション]
```

### CSV

```bash
ankiniki note import cards.csv
ankiniki note import cards.csv --preview
ankiniki note import cards.csv --deck "JavaScript" --tags "imported,js"
```

```csv
Front,Back,Deck,Tags,Model
"クロージャとは？","外側のスコープの変数を参照する関数","JavaScript","js,closures","Basic"
```

### JSON

```bash
ankiniki note import cards.json
ankiniki note import cards.json --deck "Rust"
```

```json
[
  {
    "front": "所有権とは？",
    "back": "Rust では各値に必ず1つの所有者がある。",
    "deck": "Rust",
    "tags": ["rust", "memory"]
  }
]
```

### Markdown

```bash
ankiniki note import cards.md
ankiniki note import cards.md --preview
```

```markdown
---
deck: Programming::TypeScript
tags: [typescript, types]
---

## ユニオン型とは？

**Front:** ユニオン型とは何ですか？
**Back:** 複数の型のいずれかを取れる型。`A | B` のように書く。
```

### 共通オプション

| オプション           | 短縮形 | 説明                                    |
| -------------------- | ------ | --------------------------------------- |
| `--format <fmt>`     | `-f`   | 形式を強制: `csv` / `json` / `markdown` |
| `--deck <デッキ>`    |        | デフォルトデッキ                        |
| `--model <モデル>`   |        | カードモデル（デフォルト: Basic）       |
| `--tags <タグ>`      |        | 追加タグ（カンマ区切り）                |
| `--preview`          | `-p`   | ドライラン（実際にはインポートしない）  |
| `--delimiter <文字>` | `-d`   | CSV 区切り文字（デフォルト: `,`）       |
| `--mapping <json>`   |        | CSV カスタム列マッピング                |

---

## `note tag` — タグの一括管理

AnkiConnect クエリにマッチするノートにタグをまとめて追加・削除します。

```bash
ankiniki note tag <クエリ> --add <タグ> [--remove <タグ>] [--deck <デッキ名>] [--yes]
```

**使用例:**

```bash
# デッキ内の全ノートにタグを付ける
ankiniki note tag "deck:Japanese" --add "n+1,active"

# タグを一括リネーム
ankiniki note tag "tag:old-tag" --remove "old-tag" --add "new-tag" --yes

# 今週追加したノートにタグを付ける
ankiniki note tag "added:7" --add "this-week" --yes
```

---

## `deck` — デッキ管理

```bash
ankiniki deck list
ankiniki deck create "Programming::TypeScript"
ankiniki deck delete "古いデッキ"
ankiniki deck delete "古いデッキ" --force
```

> `deck delete` はデッキ内の**すべてのカードも削除**します。デフォルトで確認プロンプトが表示されます。

---

## `export` — デッキをエクスポート

```bash
ankiniki export <デッキ名> [出力先] [--format apkg|csv|json] [--query <クエリ>] [--include-sched]
```

| 形式   | 説明                                                    |
| ------ | ------------------------------------------------------- |
| `apkg` | Anki パッケージ — Anki に直接インポート可（デフォルト） |
| `csv`  | スプレッドシート向け（全フィールド + タグ）             |
| `json` | ノートオブジェクトの JSON 配列                          |

**使用例:**

```bash
ankiniki export "JavaScript"                              # → JavaScript.apkg
ankiniki export "JavaScript" --format csv                 # → JavaScript.csv
ankiniki export "JavaScript" --format json                # → JavaScript.json
ankiniki export "JavaScript" notes.apkg --include-sched
ankiniki export "JavaScript" --format csv --query "tag:hard"
```

---

## `stats` — レビュー統計

```bash
ankiniki stats                     # 全体ダッシュボード
ankiniki stats --brief             # 1行サマリー（ステータスバー向け）
ankiniki stats --deck "JavaScript" # 特定デッキに絞り込み
```

---

## `sync` — AnkiWeb 同期

```bash
ankiniki sync
```

Anki 内蔵の「同期」ボタンと同じ動作。AnkiWeb アカウントが Anki に設定されている必要があります。

---

## `config` — 設定管理

```bash
ankiniki config --show
ankiniki config --set defaultDeck=JavaScript
ankiniki config --edit
ankiniki config --reset
```

| キー             | デフォルト値            | 説明                                              |
| ---------------- | ----------------------- | ------------------------------------------------- |
| `ankiConnectUrl` | `http://localhost:8765` | AnkiConnect API のエンドポイント                  |
| `serverUrl`      | `http://localhost:3001` | Ankiniki バックエンド（import / generate で使用） |
| `defaultDeck`    | `Default`               | デッキ未指定時に使用するデッキ名                  |
| `defaultModel`   | `Basic`                 | モデル未指定時に使用するカードモデル              |
| `debugMode`      | `false`                 | 詳細ログ出力                                      |

設定は `~/.ankiniki.json` に保存されます。

---

## よくあるワークフロー

### コーディング中にその場でカードを追加する

```bash
ankiniki note add "Rust" \
  "Option::unwrap_or_else は何をする？" \
  "値を返す。値がなければクロージャを呼んでフォールバック値を計算する。" \
  --tags "rust,option"
```

### 読書ノートを一括インポート

```bash
ankiniki note import study-notes.md --preview
ankiniki note import study-notes.md
```

### PR の差分から AI でカードを生成

```bash
git diff main | ankiniki note generate --stdin --content-type code --deck "Review" --yes
```

### ターミナルで毎日のレビュー

```bash
ankiniki study "Programming" --count 10 --random
```

### デッキをバックアップ

```bash
ankiniki export "Programming::Rust" rust-deck.apkg --include-sched
```

### タグを一括リネーム

```bash
ankiniki note tag "deck:Japanese" --remove "todo" --add "done" --yes
```

---

## トラブルシューティング

| 問題                       | 解決策                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `Cannot connect to Anki`   | Anki デスクトップが起動しているか、AnkiConnect がインストールされているか確認           |
| `Deck does not exist`      | `ankiniki deck create "<name>"` でデッキを作成するか、デッキ名のスペルを確認            |
| `Import failed: API Error` | バックエンドサーバーが起動しているか確認（`npm run dev --workspace=@ankiniki/backend`） |
| `Model does not exist`     | Anki デスクトップの設定でモデル名を確認するか、`Basic` を使用                           |

AnkiConnect の動作確認: ブラウザで `http://localhost:8765` を開くとバージョン番号が表示されます。
