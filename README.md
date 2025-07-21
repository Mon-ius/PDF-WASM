# PDF-WASM

<p align="center" width="100%">
<img src="assets/favicon.png" alt="PDF-WASM" style="width: 50%; min-width: 300px; display: block; margin: auto;">
</p>

[![CI Status](https://github.com/Mon-ius/PDF-WASM/workflows/deploy/badge.svg)](https://github.com/Mon-ius/PDF-WASM/actions?query=workflow:deploy)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)
[![Code Size](https://img.shields.io/github/languages/code-size/Mon-ius/PDF-WASM)](https://github.com/Mon-ius/PDF-WASM)
[![GitHub top language](https://img.shields.io/github/languages/top/Mon-ius/PDF-WASM?logo=rust&label=)](./Cargo.toml#L4)
[![GitHub release (with filter)](https://img.shields.io/github/v/release/Mon-ius/PDF-WASM?logo=github)](https://github.com/Mon-ius/PDF-WASM/releases)

```sh
git clone --depth 1 --branch master --recurse-submodules 'https://github.com/Mon-ius/PDF-WASM'
cd PDF-WASM

cargo install wasm-pack
cargo install wasm-bindgen-cli
cd wasm
RUSTFLAGS='--cfg getrandom_backend="wasm_js"' wasm-pack build --target web
```

## Development
```sh
git submodule add --depth 1 git@github.com:Mon-ius/lopdf.git deps/lopdf
git config -f .gitmodules submodule.deps/lopdf.shallow true
```

### Source

- [PDF-WASM](https://github.com/Mon-ius/PDF-WASM)

### Credits
- [J-F-Liu/lopdf](https://github.com/J-F-Liu/lopdf)
- [Mon-ius/PDF-WASM](https://github.com/Mon-ius/PDF-WASM)

## License

The scripts and documentation in this project are released under the [GPLv3
License].

[GPLv3 License]: LICENSE