# 教材パッケージ v1

`ankiniki content validate <file>`で、教材manifestとローカルの音声参照を検証する。Ankiやbackendは不要。Ankiへの配布は、別コマンドの[`content export`](content-apkg.md)で行う。任意のAnkiコレクション交換・復元とは異なる。

## 試す

repoのルートでビルド後に実行する。

```sh
mise exec -- npm run build:packages
mise exec -- node apps/cli/dist/index.js content validate docs/examples/content/basic-practice/content.json
mise exec -- node apps/cli/dist/index.js content validate docs/examples/content/basic-practice/content.json --public --json
```

成功時は項目数・練習数・検証したasset数を返す。`--json`は教材本文やローカルの絶対パスを含まないsummaryをstdoutへ出す。失敗は終了コード1で、`--json`ならエラーのJSONをstderrへ出す。

## Manifest

[サンプル](../examples/content/basic-practice/content.json)と、実装の[ContentPackageSchema](../../packages/shared/src/content-package.ts)を参照する。未知のフィールド・形式・版・練習方法は拒否する。Ankiのノート形式へ暗黙に変換しない。

| 項目            | 内容                                              |
| --------------- | ------------------------------------------------- |
| `format`        | `ankiniki-content`固定                            |
| `formatVersion` | `1`固定。ファイル形式の版                         |
| `packageId`     | 教材を継続して識別するID                          |
| `revision`      | 正の安全な整数。本文やassetの改訂時に作者が増やす |
| `title`         | 空白以外を含むタイトル                            |
| `visibility`    | `public`または`private`。全項目の公開区分         |
| `license`       | 教材の配布条件の宣言。`public`で必須              |
| `items`         | 一つ以上の学習項目                                |
| `assets`        | 音声assetの一覧。音声なしなら空配列               |

各項目は`itemId`、`prompt`、`answer`、一つ以上の`activities`を持つ。`explanation`とHTTP(S)の`sourceUrl`は任意。本文はプレーンテキストとして保持し、前後の空白や改行を変更しない。HTMLらしい文字列もそのままの文字であり、rendererが実行・HTML解釈する許可ではない。

IDは英数字で始まる英数字・`.`・`_`・`-`の組み合わせ。`itemId`は教材内、`activityId`は項目内、`assetId`は教材内で一意にする。`contentActivityKey`は`packageId/itemId/activityId`を返す。本文・改訂番号をidentityに混ぜない。Anki note/card IDとは別の識別子であり、GUIDへの対応は[配布仕様](content-apkg.md)で定義する。

## 練習方法

- `recall`：`activityId`と`kind`を持つ通常の問い・答え。
- `audio-response`：上記に加えて、`promptAudioId`、0以上の有限値の`responseSeconds`、任意の`answerAudioId`。音声IDはmanifestのassetを参照する。

v1は音源の部分区間、録音、採点、予定計算、任意の実行コードを含まない。CLIは再生や応答待ちを実行せず、定義と参照を検証する。

## 音声asset

各assetは`assetId`、`kind: "audio"`、`path`、`mediaType`、`byteLength`、`sha256`、`visibility`、任意の`license`を持つ。public assetのlicenseは必須で、教材の宣言から自動で引き継がない。

`mediaType`は`audio/wav`、`audio/mpeg`、`audio/mp4`、`audio/ogg`から選ぶ。`byteLength`は正の安全な整数、`sha256`は小文字16進数64桁。CLIは全宣言assetの実ファイル・サイズ・SHA-256を確認する。未参照assetも検証対象。形式のデコードや各端末での再生可否までは保証しない。

`path`はmanifestの実ファイルがあるディレクトリからの相対パスで、区切りは`/`。絶対パス、URL、`..`、空の区間、Windows予約名、制御文字、URL解釈を変える文字などは使えない。パスの重複は大文字・小文字を区別せず検出する。音声ファイルを辿った実パスが教材ディレクトリ外にある場合も拒否する。

## 公開区分と個人データ

通常の検証はprivate教材も受け取る。`--public`は教材と全assetが明示的にpublicで配布条件が宣言されていることを追加検証する。未指定の区分や配布条件を推測せず、private依存があれば失敗する。このオプションは宣言を確認するもので、公開アップロードは行わない。

公開教材と個人用教材は別manifestにする。公開fixtureは自作資料のみとし、個人用の本文・音声は別のprivate repoやローカルに置く。manifestに個人の復習履歴・録音・profile・コレクションIDを追加すると、未知の項目として拒否される。

同じ教材からの[APKG配布](content-apkg.md)は実装済み。次は短い練習セッション。[用途・設計](../design/content-and-learning.md)に開発順序と完了条件を置く。
