use lopdf::Document;
use chrono::Utc;

pub struct ProcessResult {
    pub total: usize,
    pub output: String,
}

pub fn process_(
    input: String,
    target_text: String,
    replacement_text: String,
) -> Result<ProcessResult, Box<dyn std::error::Error>> {
    let timestamp = Utc::now().format("%Y%m%d%H%M%S").to_string();
    let output = input.replace(".pdf", &format!("_{}_modified.pdf", timestamp));

    let mut doc = Document::load(input).unwrap();
    let mut total = 0;
    let pages = doc.get_pages();
    
    for (num, _) in pages {
        match doc.replace_partial_text(num, &target_text, &replacement_text, None) {
            Ok(count) => total += count,
            Err(_) => continue,
        }
    }
    
    doc.save(&output)?;

    Ok(ProcessResult {
        total,
        output,
    })
}

pub fn interface(
    file: String,
    target: String,
    replace: String,
) -> Result<(), Box<dyn std::error::Error>> {
    let result = process_(file, target, replace)?;
    println!("* Total replacements made: {}", result.total);
    println!("* Output saved to: {}", result.output);
    Ok(())
}