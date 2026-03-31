# Ankiniki CLI — ハンズオンガイド

ターミナルから Anki フラッシュカードを作成・学習・管理するための `ankiniki` CLIツール実践ガイドです。

> **English version:** [English guide here](../../../user-guides/cli/README.md)

---

## 事前準備

CLI を使用する前に以下が必要です。

1. **Anki デスクトップアプリ**が起動していること
2. **AnkiConnect アドオン**が Anki にインストールされていること（コード: `2055492159`）
   - Anki → ツール → アドオン → アドオンを取得 → コードを入力
3. **Ankiniki バックエンドサーバー**が起動していること（import コマンドで必要）
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
ankiniki config --show

# はじめてのカードを追加
ankiniki add "My Deck" "クロージャとは？" "外側のスコープの変数を参照する関数"

# デッキ一覧を表示
ankiniki list

# デッキを学習する
ankiniki study "My Deck"
```

---

## コマンド一覧

### `add` — フラッシュカードを作成

**基本形:**

```bash
ankiniki add [デッキ名] [表面] [裏面]
```

**使用例:**

```bash
# 引数で直接指定（最速）
ankiniki add "JavaScript" "ホイスティングとは？" "宣言をスコープの先頭に移動する動作"

# タグとモデルを指定
ankiniki add "Rust" "所有権とは？" "各値には必ず1つの所有者がある" \
  --tags "rust,memory,ownership" \
  --model "Basic"

# デフォルトデッキを使用（config で設定済みの場合）
ankiniki add "モナドとは？" "自己関手の圏におけるモノイド対象"

# インタラクティブモード — すべてを対話形式で入力
ankiniki add --interactive
ankiniki add -i
```

**オプション一覧:**

| オプション        | 短縮形 | 説明                              |
| ----------------- | ------ | --------------------------------- |
| `--tags <tags>`   | `-t`   | タグ（カンマ区切り）              |
| `--model <model>` | `-m`   | カードモデル（デフォルト: Basic） |
| `--interactive`   | `-i`   | 対話形式で入力                    |

**インタラクティブモード**では表面・裏面の入力に `$EDITOR` が開きます。複数行のコードスニペットを書くときに便利です。

---

### `study` — ターミナルで学習セッション

表面を表示 → Enter で裏面を表示 → 1〜4で評価、という流れで学習します。

```bash
ankiniki study [デッキ名]
```

**使用例:**

```bash
# 特定のデッキを学習（デフォルト5枚）
ankiniki study "JavaScript"

# 20枚をランダム順で学習
ankiniki study "JavaScript" --count 20 --random
ankiniki study "JavaScript" -n 20 --random

# デッキ名を省略すると選択肢が表示される
ankiniki study
```

**オプション一覧:**

| オプション    | 短縮形 | 説明                      |
| ------------- | ------ | ------------------------- |
| `--count <n>` | `-n`   | 学習枚数（デフォルト: 5） |
| `--random`    |        | カードをシャッフル        |

**評価基準:**

| 選択肢   | 意味                 |
| -------- | -------------------- |
| ❌ Again | わからなかった       |
| 🔶 Hard  | わかったが難しかった |
| ✅ Good  | わかった             |
| 🚀 Easy  | 簡単すぎた           |

> **注意:** このモードは Anki のスケジューリングに関係なく、デッキ内のカードを取得します。Anki の間隔反復スケジュールに従って学習する場合は、Anki デスクトップで通常どおりレビューしてください。

---

### `list` — デッキとカードの一覧表示

```bash
ankiniki list                          # デッキ一覧（デフォルト）
ankiniki list --decks                  # 同上
ankiniki list --cards "My Deck"        # デッキ内のカードを表示
ankiniki list --cards "My Deck" --limit 50
```

**使用例:**

```bash
# 全デッキをカード数つきで表示
ankiniki list

# デッキ内のカードを確認（最初の10枚）
ankiniki list --cards "JavaScript"

# より多く表示
ankiniki list --cards "JavaScript" --limit 50
```

**オプション一覧:**

| オプション         | 短縮形 | 説明                           |
| ------------------ | ------ | ------------------------------ |
| `--decks`          | `-d`   | デッキ一覧を表示               |
| `--cards <デッキ>` | `-c`   | デッキ内のカードを表示         |
| `--limit <n>`      | `-l`   | 表示件数上限（デフォルト: 10） |

---

### `config` — 設定管理

```bash
ankiniki config               # 現在の設定を表示（デフォルト）
ankiniki config --show
ankiniki config --edit        # 対話形式で編集
ankiniki config --set key=value
ankiniki config --reset       # デフォルトに戻す
```

**設定項目:**

| キー             | デフォルト値            | 説明                                           |
| ---------------- | ----------------------- | ---------------------------------------------- |
| `ankiConnectUrl` | `http://localhost:8765` | AnkiConnect API のエンドポイント               |
| `serverUrl`      | `http://localhost:3001` | Ankiniki バックエンド（import コマンドで使用） |
| `defaultDeck`    | `Default`               | デッキ未指定時に使用するデッキ名               |
| `defaultModel`   | `Basic`                 | モデル未指定時に使用するカードモデル           |
| `debugMode`      | `false`                 | 詳細ログ出力                                   |

**使用例:**

```bash
# 現在の設定と接続状態を確認
ankiniki config --show

# デフォルトデッキを変更
ankiniki config --set defaultDeck=JavaScript

# バックエンドの URL を変更
ankiniki config --set serverUrl=http://localhost:3001

# 対話形式で編集（デッキ・モデルの選択肢が表示される）
ankiniki config --edit

# すべての設定をデフォルトに戻す
ankiniki config --reset
```

設定は `~/.ankiniki.json` に保存されます。

---

### `import` — ファイルから一括インポート

CSV・JSON・Markdown ファイルから複数のカードを一度にインポートします。**ファイル拡張子から形式が自動判別されます。**

```bash
ankiniki import <ファイル> [オプション]
```

#### CSV インポート

```bash
# 拡張子 .csv から自動判別
ankiniki import cards.csv

# プレビュー（カードは作成されない）
ankiniki import cards.csv --preview

# デフォルトデッキとタグを指定
ankiniki import cards.csv --deck "JavaScript" --tags "imported,js"
```

**CSV 形式:**

```csv
Front,Back,Deck,Tags,Model
"クロージャとは？","外側のスコープの変数を参照する関数","JavaScript","js,closures","Basic"
"ホイスティングとは？","宣言をスコープの先頭に移動する動作","JavaScript","js","Basic"
```

シンプルな形式（デッキ・タグは CLI フラグで指定）:

```csv
Front,Back
"クロージャとは？","外側のスコープの変数を参照する関数"
```

カスタム列名を使う場合:

```bash
ankiniki import cards.csv \
  --mapping '{"front":"質問","back":"回答","deck":"教科","tags":"タグ"}'
```

---

#### JSON インポート

```bash
# 拡張子 .json から自動判別
ankiniki import cards.json

ankiniki import cards.json --preview
ankiniki import cards.json --deck "Rust" --tags "rust"
```

**JSON 形式（配列）:**

```json
[
  {
    "front": "所有権とは？",
    "back": "Rust では各値に必ず1つの所有者がある。",
    "deck": "Rust",
    "tags": ["rust", "memory"]
  },
  {
    "front": "借用とは？",
    "back": "所有権を移さずに値を一時的に使うこと。",
    "deck": "Rust",
    "tags": ["rust", "memory"]
  }
]
```

**JSON 形式（デフォルト値つきオブジェクト）:**

```json
{
  "deck_name": "Rust",
  "default_tags": ["rust"],
  "default_model": "Basic",
  "cards": [
    { "front": "所有権とは？", "back": "各値に必ず1つの所有者がある。" },
    { "front": "借用とは？", "back": "所有権を移さずに値を一時的に使うこと。" }
  ]
}
```

---

#### Markdown インポート

```bash
# 拡張子 .md から自動判別
ankiniki import cards.md

ankiniki import cards.md --preview
ankiniki import cards.md --deck "TypeScript"
```

**Markdown 形式:**

```markdown
---
deck: Programming::TypeScript
tags: [typescript, types]
---

## 型アサーションとは？

**Front:** TypeScript における型アサーションとは何ですか？
**Back:** コンパイラに対して「この値はこの型として扱え」と指示する構文。`as` または `<Type>` を使う。

## ユニオン型とは？

**Front:** ユニオン型とは何ですか？
**Back:** 複数の型のいずれかを取れる型。`A | B` のように書く。
```

- フロントマター（`---` ブロック）でデフォルトのデッキとタグを設定
- `##` 見出しごとに1枚のカード
- 各セクションに `**Front:**` と `**Back:**` が必要

---

#### インポート共通オプション

| オプション           | 短縮形 | 説明                                         |
| -------------------- | ------ | -------------------------------------------- |
| `--format <fmt>`     | `-f`   | 形式を強制指定: `csv` / `json` / `markdown`  |
| `--deck <デッキ>`    |        | デフォルトデッキ（ファイル内の設定を上書き） |
| `--model <モデル>`   |        | カードモデル（デフォルト: Basic）            |
| `--tags <タグ>`      |        | 追加タグ（カンマ区切り）                     |
| `--preview`          | `-p`   | ドライラン — 実際にはインポートしない        |
| `--dry-run`          |        | `--preview` と同じ                           |
| `--delimiter <文字>` | `-d`   | CSV 区切り文字（デフォルト: `,`）            |
| `--mapping <json>`   |        | CSV カスタム列マッピング                     |

---

### `import mapping` — 形式サンプルを表示

```bash
ankiniki import mapping
```

---

### `deck` — デッキ管理

```bash
ankiniki deck list                   # デッキ一覧をカード数つきで表示
ankiniki deck create <name>          # デッキを作成
ankiniki deck delete <name>          # デッキを削除（確認プロンプトあり）
ankiniki deck delete <name> --force  # 確認をスキップして削除
```

**使用例:**

```bash
# デッキ一覧を確認
ankiniki deck list

# ネストしたデッキを作成
ankiniki deck create "Programming::TypeScript"

# デッキを削除
ankiniki deck delete "古いデッキ"
```

> `ankiniki deck delete` はデッキ内の**すべてのカードも削除**します。デフォルトで確認プロンプトが表示されます。

---

### `delete` — カードを削除

```bash
ankiniki delete <noteId>           # カードのプレビューを表示して確認
ankiniki delete <noteId> --force   # 確認をスキップして削除
```

Note ID は `ankiniki list --cards <デッキ>` で確認できます。

**使用例:**

```bash
# まず Note ID を確認
ankiniki list --cards "JavaScript"
# → 1. Card ID: 1700000001
#      Front: ホイスティングとは？

# 削除
ankiniki delete 1700000001
```

---

### `export` — デッキを `.apkg` としてエクスポート

```bash
ankiniki export <デッキ名> [出力先]
```

**使用例:**

```bash
# カレントディレクトリに保存（JavaScript.apkg として保存）
ankiniki export "JavaScript"

# 保存先を指定
ankiniki export "Programming::Rust" ~/backups/rust.apkg

# 学習履歴・スケジューリングデータも含める
ankiniki export "JavaScript" --include-sched
```

**オプション:**

| オプション        | 説明                                      |
| ----------------- | ----------------------------------------- |
| `--include-sched` | Anki のスケジューリングと学習履歴を含める |

エクスポートした `.apkg` ファイルは、Anki の「ファイル → インポート」から任意の Anki 環境にインポートできます。

---

## よくあるワークフロー

### コーディング中にその場でカードを追加する

```bash
# Rust を調べていて気づいたことをすぐ追加
ankiniki add "Rust" \
  "Option::unwrap_or_else は何をする？" \
  "値を返す。値がなければクロージャを呼んでフォールバック値を計算する。" \
  --tags "rust,option,error-handling"

# 追加されたか確認
ankiniki list --cards "Rust"
```

### 読書ノートを一括インポート

```bash
# ドキュメントを読みながら Markdown でカードを書いて、まとめてインポート
ankiniki import study-notes.md --preview   # まずプレビューで確認
ankiniki import study-notes.md
```

### ターミナルで毎日のレビュー

```bash
# メインデッキからランダムに10枚
ankiniki study "Programming" --count 10 --random
```

### デッキをバックアップ・共有する

```bash
# 同僚への共有や別マシンへの移行のためにエクスポート
ankiniki export "Programming::Rust" rust-deck.apkg

# 学習履歴（進捗・スケジュール）も含める
ankiniki export "Programming::Rust" rust-deck.apkg --include-sched
# 移行先での取り込み: Anki → ファイル → インポート → rust-deck.apkg を選択
```

### 不要なカードを削除する

```bash
# カード一覧で Note ID を確認
ankiniki list --cards "JavaScript" --limit 50

# Note ID を指定して削除
ankiniki delete 1700000001
```

### 新しいマシンでの設定

```bash
ankiniki config --edit   # ankiConnectUrl, serverUrl, defaultDeck を設定
ankiniki config --show   # 接続確認
```

---

## トラブルシューティング

| 問題                       | 解決策                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `Cannot connect to Anki`   | Anki デスクトップが起動しているか、AnkiConnect がインストールされているか確認           |
| `Deck does not exist`      | Anki でデッキを先に作成するか、デッキ名のスペルを確認                                   |
| `Import failed: API Error` | バックエンドサーバーが起動しているか確認（`npm run dev --workspace=@ankiniki/backend`） |
| `Model does not exist`     | `ankiniki list` でモデル名を確認するか、`Basic` を使用                                  |

AnkiConnect の動作確認: ブラウザで `http://localhost:8765` を開くとバージョン番号が表示されます。
