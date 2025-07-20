use wasm_bindgen::prelude::*;
use ld_::{process_, ProcessResult as OriginalProcessResult};

#[wasm_bindgen]
pub struct ProcessResult {
    total: usize,
    output: String,
}

#[wasm_bindgen]
impl ProcessResult {
    #[wasm_bindgen(getter)]
    pub fn total(&self) -> usize {
        self.total
    }

    #[wasm_bindgen(getter)]
    pub fn output(&self) -> String {
        self.output.clone()
    }
}

impl From<OriginalProcessResult> for ProcessResult {
    fn from(original: OriginalProcessResult) -> Self {
        ProcessResult {
            total: original.total,
            output: original.output,
        }
    }
}

#[wasm_bindgen]
pub fn process_pdf(
    input: String,
    target_text: String,
    replacement_text: String,
) -> Result<ProcessResult, JsValue> {
    match process_(input, target_text, replacement_text) {
        Ok(result) => Ok(result.into()),
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}