# PDF-WASM


```sh
git submodule add --depth 1 git@github.com:Mon-ius/lopdf.git deps/lopdf
git config -f .gitmodules submodule.deps/lopdf.shallow true
```

```sh
cargo install wasm-pack
cargo install wasm-bindgen-cli
cd wasm
RUSTFLAGS='--cfg getrandom_backend="wasm_js"' wasm-pack build --target web
```