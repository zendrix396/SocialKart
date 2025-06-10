import argparse
import json
import os
import time
from pathlib import Path

import requests
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, DownloadColumn, TransferSpeedColumn

console = Console()

def extract_media_links(data):
    """Recursively search the JSON response for download links."""
    links = []
    
    # First pass: Look for Zoraahub proxy download links
    def search_zoraahub(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, str) and 'media.zoraahub.com/download.php' in v:
                    links.append(v)
                elif isinstance(v, (dict, list)):
                    search_zoraahub(v)
        elif isinstance(obj, list):
            for item in obj:
                search_zoraahub(item)
                
    search_zoraahub(data)
    
    # Second pass: If no proxy links exist, look for direct Instagram CDN links
    if not links:
        def search_direct(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str) and 'cdninstagram.com' in v:
                        # Grab specific keys to avoid downloading profile pictures or tracker pixels
                        if k.lower() in ['url', 'video_url', 'display_url', 'download_url', 'link']:
                            links.append(v)
                    elif isinstance(v, (dict, list)):
                        search_direct(v)
            elif isinstance(obj, list):
                for item in obj:
                    search_direct(item)
        search_direct(data)
        
    # Remove duplicates while preserving order
    return list(dict.fromkeys(links))

def fetch_instagram_media(ig_url: str, output_dir: str):
    download_path = Path(output_dir).absolute()
    download_path.mkdir(parents=True, exist_ok=True)

    # ---------------------------------------------------------
    # 1. FETCH METADATA FROM ZORAAHUB API
    # ---------------------------------------------------------
    api_url = "https://api.zoraahub.com/fetch.php"
    
    # Replicating your exact cURL headers to bypass CORS/Firewalls
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
        "Origin": "https://downreels.com",
        "Referer": "https://downreels.com/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
    }
    
    payload = {"url": ig_url}

    with console.status("[cyan]Fetching media metadata from API...[/cyan]"):
        try:
            response = requests.post(api_url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            console.print(f"[bold red]API Request Failed: {e}[/bold red]")
            if hasattr(e, 'response') and e.response is not None:
                console.print(f"[dim]Response: {e.response.text}[/dim]")
            return
        except json.JSONDecodeError:
            console.print("[bold red]Failed to parse API response as JSON.[/bold red]")
            console.print(f"[dim]Response: {response.text[:500]}[/dim]")
            return

    # ---------------------------------------------------------
    # 2. EXTRACT DOWNLOAD LINKS
    # ---------------------------------------------------------
    urls_to_download = extract_media_links(data)
    
    if not urls_to_download:
        console.print("[bold red]No downloadable media found in the API response.[/bold red]")
        console.print("[yellow]The post might be private, deleted, or the API structure changed.[/yellow]")
        # Print raw response for debugging if it failed
        console.print(f"[dim]{json.dumps(data, indent=2)[:500]}[/dim]")
        return
        
    console.print(f"[bold green]Found {len(urls_to_download)} media file(s)![/bold green]")

    # ---------------------------------------------------------
    # 3. DOWNLOAD FILES
    # ---------------------------------------------------------
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        DownloadColumn(),
        TransferSpeedColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
    ) as progress:
        
        for idx, href in enumerate(urls_to_download):
            # Heuristically determine file extension from URL parameters
            ext = ".mp4" if ".mp4" in href or "video" in href.lower() else ".jpg"
            if ".webp" in href: ext = ".webp"
            
            filename = f"ig_media_{idx+1}_{int(time.time())}{ext}"
            filepath = download_path / filename

            task_id = progress.add_task(f"[cyan]Downloading {filename}...", start=False)
            
            try:
                # Add download headers (remove content-type for GET requests)
                dl_headers = headers.copy()
                dl_headers.pop("Content-Type", None)
                
                # Stream the download so we can track progress for large videos
                res = requests.get(href, headers=dl_headers, stream=True, timeout=15)
                res.raise_for_status()
                
                total_size = int(res.headers.get('content-length', 0))
                progress.update(task_id, total=total_size, advance=0)
                progress.start_task(task_id)

                with open(filepath, 'wb') as file:
                    for chunk in res.iter_content(chunk_size=8192):
                        file.write(chunk)
                        progress.advance(task_id, advance=len(chunk))
                        
                console.print(f"  [green]Saved:[/green] {filepath.name}")
            except Exception as e:
                console.print(f"  [red]Failed to download item {idx+1}: {e}[/red]")

    console.print(Panel(
        f"[bold green]Instagram Media Extraction Complete![/bold green]\n"
        f"[white]Saved to:[/white] [cyan]{download_path}[/cyan]"
    ))


def main():
    parser = argparse.ArgumentParser(description="Pure HTTP Instagram Downloader (via Downreels/Zoraahub)")
    parser.add_argument("url", type=str, help="Instagram Video, Reel, Carousel, or Post URL")
    parser.add_argument("--out", type=str, default="downloads", help="Folder to save the media")

    args = parser.parse_args()

    try:
        fetch_instagram_media(args.url, args.out)
    except KeyboardInterrupt:
        console.print("\n[yellow]Process interrupted by user.[/yellow]")

if __name__ == "__main__":
    main()
