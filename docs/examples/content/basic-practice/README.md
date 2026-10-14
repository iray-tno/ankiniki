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
```

This fixture demonstrates [the content contract](../../../reference/content-package.md).
It is not an Anki backup, an APKG or an implemented playback UI.
