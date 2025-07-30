# Price scraper.py

import requests
import re
import yaml
from bs4 import BeautifulSoup
from rich.table import Table
from rich.console import Console
import time
from typing import Dict, Any
import os

PRICE_UNIT_PATTERN = re.compile(
    r"£\s?[\d,]+(?:\.\d+)?\s*(?:per\s*(?:month|year|week|day|annum)|/(?:month|year|week|day))?",
    re.IGNORECASE
)

class PriceScraper:
    def __init__(self, config: Dict[str, Any], rate_limit_seconds: float = 1.0):
        self.config = config
        self.headers = {
            "User-Agent": "PriceScraperBot/1.0 (+https://yourdomain.com)"
        }
        self.rate_limit_seconds = rate_limit_seconds
        self._last_request_time = 0.0

    def _rate_limit(self):
        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit_seconds:
            time.sleep(self.rate_limit_seconds - elapsed)
        self._last_request_time = time.time()

    def fetch(self, url: str) -> str:
        self._rate_limit()
        resp = requests.get(url, headers=self.headers, timeout=10)
        resp.raise_for_status()
        return resp.text

    def parse_prices(self, html: str, selectors: list) -> list:
        soup = BeautifulSoup(html, "html.parser")
        # Try each CSS selector in order
        for sel in selectors:
            els = soup.select(sel)
            phrases = []
            for el in els:
                text = el.get_text(" ", strip=True)
                matches = PRICE_UNIT_PATTERN.findall(text)
                phrases.extend(matches)
            if phrases:
                return phrases
        # Fallback: regex search over full text
        text = soup.get_text(" ", strip=True)
        return PRICE_UNIT_PATTERN.findall(text)

    def get_site_prices(self, site_key: str) -> tuple:
        site = self.config.get(site_key, {})
        html = self.fetch(site.get("url", ""))
        prices = self.parse_prices(html, site.get("price_selectors", []))
        return site_key, prices


def load_config(path: str = None) -> Dict[str, Any]:
    if path is None:
        script_dir = os.path.dirname(__file__)
        path = os.path.join(script_dir, "config.yaml")
    with open(path, "r") as f:
        return yaml.safe_load(f)


def show_prices(results: list):
    table = Table(title="Newspaper Subscription Prices")
    table.add_column("Publisher", style="cyan", no_wrap=True)
    table.add_column("Prices (raw)", style="magenta")
    for name, prices in results:
        table.add_row(name, ", ".join(prices) if prices else "❌ not found")
    Console().print(table)


def main():
    config = load_config()
    scraper = PriceScraper(config)
    results = []
    for site_key in config:
        try:
            name, prices = scraper.get_site_prices(site_key)
        except Exception as e:
            name, prices = site_key, []
            print(f"[!] Error fetching {site_key}: {e}")
        results.append((name, prices))
    show_prices(results)


if __name__ == "__main__":
    main()