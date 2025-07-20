# PDF-WASM

[![CI Status](https://github.com/Mon-ius/PDF-WASM/workflows/build/badge.svg)](https://github.com/Mon-ius/PDF-WASM/actions?query=workflow:deploy)
[![Code Size](https://img.shields.io/github/languages/code-size/Mon-ius/PDF-WASM)](https://github.com/Mon-ius/PDF-WASM)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

## Deploy

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
[PDF-WASM](https://github.com/Mon-ius/PDF-WASM)

### Credits
- [J-F-Liu/lopdf](https://github.com/J-F-Liu/lopdf)
- [Mon-ius/PDF-WASM](https://github.com/Mon-ius/PDF-WASM)

## License

The scripts and documentation in this project are released under the [GPLv3
License].

[GPLv3 License]: LICENSE