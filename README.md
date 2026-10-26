# Audible US metadata for Multiplexr

Experimental metadata lookup for the Audible US public catalog. Returns title, authors, narrators, publisher, release date, language and series where available. No audio, account login or downloads.

Allow your audiobook collection and `https://api.audible.com` in **Manage > Permissions**, then enable the plugin. The public catalog endpoint is not a supported general developer API and can change. Other marketplaces are not included.

## Install

Requires the patched Multiplexr plugin host (0.5.1 or newer). Download the signed `.mpx.json` from Releases and install it through **Settings > Plugins & themes**. Review access before enabling. The 0.1.0 release was a starter and has no metadata handler.

## Development

Node.js 22 or newer.

```sh
npm ci
npm run check
npm test
npm run build
```

Tests use the bundled plugin entrypoint with host fixtures, not service credentials. To sign, run `npm run sign -- --key /private/publisher.pem`. Keep the publisher key outside the repository. The release workflow uses the `PLUGIN_SIGNING_KEY` Actions secret.

[Plugin SDK](https://github.com/bugdeployer/Multiplexr/tree/main/packages/multiplexr_plugin_sdk) · GPL-3.0-only.
