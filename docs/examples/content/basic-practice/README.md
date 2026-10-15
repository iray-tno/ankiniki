# Basic practice fixture

This package contains three original technical questions and one short English
response prompt. Text and the generated `audio/cue.wav` are provided under the
repository's [MIT license](../../../../LICENSE).

The half-second WAV is a synthetic cue, not speech or a model pronunciation.
It is generated from integer triangle-wave samples and contains no recordings
from learning materials. See [the generator](../../../../scripts/generate-content-cue.mjs).

From the repository root, regenerate it with:

```sh
mise exec -- node scripts/generate-content-cue.mjs
```

The generator prints its byte length and SHA-256. Its current bytes match the
declarations in `content.json`. If changing the generator or audio, update those
declarations and increment the lesson revision while retaining its identities.

Validate the package after building the CLI:

```sh
mise exec -- node apps/cli/dist/index.js content validate docs/examples/content/basic-practice/content.json --public --json
mise exec -- node apps/cli/dist/index.js content export docs/examples/content/basic-practice/content.json practice.apkg --modified-at 2026-10-14T12:00:00Z --public --json
```

This fixture demonstrates [the content contract](../../../reference/content-package.md)
and [standalone APKG generation](../../../reference/content-apkg.md). The example
release time is fixed for this revision. It is not a personal Anki backup or an
implemented application playback UI.
