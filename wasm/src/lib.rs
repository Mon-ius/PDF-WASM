use wasm_bindgen::prelude::*;
use ld_::{process2_, MemResult};

#[wasm_bindgen]
pub struct ProcessResult {
    total: usize,
    mem: Vec<u8>,
}

#[wasm_bindgen]
impl ProcessResult {
    #[wasm_bindgen(getter)]
    pub fn total(&self) -> usize {
        self.total
    }

    #[wasm_bindgen(getter)]
    pub fn mem(&self) -> Vec<u8> {
        self.mem.clone()
    }
}

impl From<MemResult> for ProcessResult {
    fn from(result: MemResult) -> Self {
        ProcessResult {
            total: result.total,
            mem: result.mem,
        }
    }
}

#[wasm_bindgen]
pub fn process_pdf(
    input: Vec<u8>,
    target_text: String,
    replacement_text: String,
    use_partial: bool,
) -> Result<ProcessResult, JsValue> {
    match process2_(input, target_text, replacement_text, use_partial) {
        Ok(result) => Ok(result.into()),
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}