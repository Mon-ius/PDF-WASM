use lopdf::Document;
use chrono::Utc;

pub struct MemResult {
    pub total: usize,
    pub mem: Vec<u8>
}

pub struct FileResult {
    pub total: usize,
    pub output: String
}

pub fn _output(input: String) -> String {
    let timestamp = Utc::now().format("%Y%m%d%H%M%S%3f").to_string();
    input.replace(".pdf", &format!("_{}.pdf", timestamp))
}

fn _process(
    doc: &mut Document,
    target_text: &str,
    replacement_text: &str,
) -> usize {
    let mut total = 0;
    let pages = doc.get_pages();
    
    for (num, _) in pages {
        match doc.replace_partial_text(num, target_text, replacement_text, None) {
            Ok(count) => total += count,
            Err(_) => continue,
        }
    }
    
    total
}

pub fn process_(
    input: String,
    target_text: String,
    replacement_text: String,
) -> Result<FileResult, Box<dyn std::error::Error>> {
    let output = _output(input.clone());
    
    let mut doc = Document::load(&input)?;
    let total = _process(&mut doc, &target_text, &replacement_text);
    
    doc.save(&output)?;
    
    Ok(FileResult {
        total,
        output,
    })
}

pub fn process2_(
    input: Vec<u8>,
    target_text: String,
    replacement_text: String,
) -> Result<MemResult, Box<dyn std::error::Error>> {
    let mut doc = Document::load_mem(&input)?;
    let total = _process(&mut doc, &target_text, &replacement_text);
    let mut mem = Vec::new();
    doc.save_to(&mut mem)?;
    
    Ok(MemResult {
        total,
        mem,
    })
}


pub fn interface(
    file: String,
    target: String,
    replace: String,
) -> Result<(), Box<dyn std::error::Error>> {
    let result = process_(file.clone(), target.clone(), replace.clone())?;
    println!("* Total replacements made: {}", result.total);
    println!("* Output saved to: {}", result.output);

    let _bytes = std::fs::read(&file)?;
    let result = process2_(_bytes, target, replace)?;
    let output = _output(file);
    std::fs::write(&output, result.mem)?;

    println!("* Total replacements made: {}", result.total);
    println!("* Output saved to: {}", output);
    Ok(())
}