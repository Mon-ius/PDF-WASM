use clap::Parser;

#[cfg(all(target_env = "musl", target_pointer_width = "64"))]
use jemallocator::Jemalloc;

#[cfg(not(all(target_env = "musl")))]
use mimalloc::MiMalloc;

#[cfg(all(target_env = "musl", target_pointer_width = "64"))]
#[global_allocator]
static GLOBAL: Jemalloc = Jemalloc;

#[cfg(not(all(target_env = "musl")))]
#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

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
