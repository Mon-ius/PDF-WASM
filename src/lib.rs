use std::path::PathBuf;
use lopdf::Document;

pub fn process_(
    input: PathBuf,
    output_path: PathBuf,
    target_text: String,
    replacement_text: String,
) -> Result<usize, Box<dyn std::error::Error>> {
    let mut doc = Document::load(input).unwrap();
    let mut total = 0;
    let pages = doc.get_pages();
    
    for (num, _) in pages {
        match doc.replace_text(num, &target_text, &replacement_text) {
            Ok(_) => total += 1,
            Err(_) => continue,
        }
    }
    
    doc.save(&output_path)?;
    println!("* Modified PDF saved as: {}", output_path.display());

    Ok(total)
}

pub fn interface(
    file: String,
    target: String,
    replace: String,
) -> Result<(), Box<dyn std::error::Error>> {
    let saved = file.replace(".pdf", "_modified.pdf");

    let replacements = process_(file.into(), saved.into(), target, replace)?;
    
    println!("* Total replacements made: {}", replacements);
    
    Ok(())
}