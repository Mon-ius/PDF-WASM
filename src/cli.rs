use clap::Parser;

#[derive(Parser)]
#[command(about = "The Rust WASM Project for simple PDF text replacement")]
struct Cli {
    #[arg(short = 'f', long = "file", name = "FILE", help = "Path to PDF file")]
    file: String,
    #[arg(short = 't', long = "target", name = "TARGET", help = "Text to find and replace")]
    target: String,
    #[arg(short = 'r', long = "replace", name = "REPLACE", help = "Text to replace with")]
    replace: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let start_time = std::time::Instant::now();

    {
        let cli = Cli::parse();
        let _ = ld_::interface(
            cli.file,
            cli.target,
            cli.replace,
        );
    }

    println!("Processing time: {:?}", start_time.elapsed());
    Ok(())
}
