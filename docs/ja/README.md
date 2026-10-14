# Ankiniki ドキュメント

現在の構成はCLI、Expressバックエンド、Tauriデスクトップ、VS Code拡張です。
モバイルはReact Native＋Hozoでの画面共有を計画しています。

当面はAnkiのデータを保った取り込み・書き出しを優先します。
独自コレクションと学習スケジューラは、その次の段階です。

- [プロジェクト概要](../../README.md)
- [開発環境：mise経由のセットアップ](../developer/environment.md)
- [開発ガイド](../../DEVELOPMENT.md)
- [設計と段階的な移行](../design/local-first-architecture.md)
- [Ankiデータ交換の互換性](../design/anki-exchange.md)
- [CLIガイド](user-guides/cli/README.md)
- [デッキ構成](ユーザーガイド/デッキ構成/README.md)
- [最新のCLIコマンド](../../apps/cli/README.md)
- [ドキュメント全体](../README.md)

開発用のNode/npmは `mise.toml` に従います。
`mise exec -- npm run setup` でセットアップ、`mise exec -- npm run ci` で検証します。
