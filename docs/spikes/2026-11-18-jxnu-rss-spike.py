#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
【Spike 用途说明】
本脚本仅用于 ADR-003（docs/adr/ADR-003-二课数据源选型.md）的可行性验证，
用于证明 RSS 是该站点的可靠数据源、并量化字段抽取覆盖率。

生产实现为 TypeScript（apps/server/src/activities/crawler/），
本文件保留在 docs/spikes/ 供答辩与复现使用，不参与构建，不要接入运行流程。

JXNU PUBLISH 通知抓取（RSS 模式 · 推荐）

为什么走 RSS 而不是抓 HTML：
  https://jxnu-publish.asia/ 是 React SPA，<body> 里只有加载动画，
  真实内容由 JS 请求后注入，直接 GET 首页只能拿到约 5.6KB 的空壳。
  站点在 robots.txt 里把 Sitemap 指向 /rss.xml，等于官方明示：
  “要批量取数据，请读这个 RSS”。RSS 含 120 条结构化条目，
  字段有 title / link / guid / pubDate / description / category[] / enclosure。

用法：
    python jxnu_rss.py                          # 抓全量，输出 jxnu_notices.json
    python jxnu_rss.py --limit 10 --format csv   # 只取 10 条，输出 CSV
    python jxnu_rss.py --fixture fixtures/rss_20261118.xml   # 同时存原始快照（给测试用）
    python jxnu_rss.py --out data/2026-11-18.json

依赖：requests、beautifulsoup4、lxml
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------------------------------------------- 配置

BASE_URL = "https://jxnu-publish.asia"
RSS_PATH = "/rss.xml"

# 用诚实、可联系的 UA，不伪装浏览器。实测该站点接受此类 UA。
USER_AGENT = (
    "CampusMeshBot/0.1 (course project; +https://example.edu/campusmesh; "
    "contact: d@example.edu)"
)

CST = timezone(timedelta(hours=8))
REQUEST_DELAY = 1.5          # 同一域连续请求的最小间隔（秒），遵守“限速 1 次/2 秒”量级
TIMEOUT = (10, 40)           # (连接, 读取) 秒

# ---------------------------------------------------------------- 数据模型


@dataclass
class Notice:
    """与 SRS 表 24 Activity 字段对齐的条目（不以通知格式为准，以落库为准）。"""
    sourceUrl: str
    title: str
    description: str
    publishedAt: str          # ISO 8601 UTC
    organizer: str | None     # 近似：第一个 category
    categories: list[str]
    image: str | None
    contentHash: str
    fetchedAt: str
    # 从中文描述里启发式抽取，置信度有限，字段后缀 _hint 提醒下游不要当真值用
    startTime_hint: str | None = None
    timeRange_hint: str | None = None
    location_hint: str | None = None
    credits_hint: float | None = None


# ---------------------------------------------------------------- 网络


def make_session() -> requests.Session:
    """带重试与会话复用的 requests 会话。"""
    session = requests.Session()
    session.headers.update({
        "User-Agent": USER_AGENT,
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
    })
    retry = Retry(
        total=3,
        backoff_factor=1.0,                    # 重试间隔 1s, 2s, 4s
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET", "HEAD"}),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=4, pool_maxsize=4)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def fetch_rss(session: requests.Session, url: str = BASE_URL + RSS_PATH) -> tuple[bytes, str]:
    """取 RSS 原始字节与最终 URL（站点会 301 跳到 publish.betterjxnu.cn）。"""
    resp = session.get(url, timeout=TIMEOUT, allow_redirects=True)
    resp.raise_for_status()
    if not resp.content:
        raise RuntimeError(f"响应为空：{resp.url}")
    return resp.content, resp.url


# ---------------------------------------------------------------- 解析

_WS_RE = re.compile(r"[\s\u3000]+")
_DATE_RE = re.compile(r"(\d{1,2})\s*月\s*(\d{1,2})\s*日")
_RANGE_RE = re.compile(
    r"(\d{1,2})[:：](\d{2})\s*(?:至|到|—|–|-|~|～)\s*(\d{1,2})[:：](\d{2})"
)
_CREDIT_RE = re.compile(
    r"(?:第二课堂|二课|绩点|学时)[^\d。；，]{0,8}(\d+(?:\.\d+)?)\s*个?\s*(?:绩点|学时)?"
)
_LOCATION_RE = re.compile(
    r"(?:在|于)\s*([^，。；、\s]{2,24}?(?:楼|场|馆|厅|室|中心|校区|教室|广场)[A-Za-z0-9\-]*)"
)
_HM_RE = re.compile(r"(\d{1,2})[:：](\d{2})")
# “10月25日12:00截止”是报名截止，不是活动开始 —— 这些词一出现就跳过该日期
_DEADLINE_WORDS = ("截止", "截至", "之前", "前完成", "报名成")
_IMAGE_EXT = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg")


def clean_text(text: str) -> str:
    """去标签、反转义、压缩空白、全角转半角（保留中文标点）。"""
    soup = BeautifulSoup(text or "", "html.parser")
    plain = soup.get_text(" ", strip=True)
    # 只把全角数字/字母转半角，避免 NFKC 把中文标点也改掉
    plain = "".join(
        unicodedata.normalize("NFKC", ch) if ch.isdigit() else ch for ch in plain
    )
    return _WS_RE.sub(" ", plain).strip()


def parse_rss(xml_bytes: bytes) -> list[dict[str, Any]]:
    """把 RSS 的 <item> 解析成字典列表（这一步不做业务推断）。"""
    soup = BeautifulSoup(xml_bytes, "xml")   # 用 lxml 的 XML 解析器，避免 HTML 容错改写
    channel = soup.find("channel")
    if channel is None:
        raise ValueError("不是合法 RSS：找不到 <channel>")

    items: list[dict[str, Any]] = []
    for item in channel.find_all("item"):
        title = clean_text(item.title.get_text() if item.title else "")
        link = (item.link.get_text().strip() if item.link else "")
        guid_tag = item.find("guid")
        guid = guid_tag.get_text().strip() if guid_tag else ""

        pub_raw = item.pubDate.get_text().strip() if item.pubDate else ""
        try:
            pub_dt = parsedate_to_datetime(pub_raw).astimezone(timezone.utc)
        except (TypeError, ValueError):
            pub_dt = datetime.now(timezone.utc)

        desc_tag = item.find("description")
        description = clean_text(desc_tag.get_text() if desc_tag else "")

        categories = [clean_text(c.get_text()) for c in item.find_all("category")]

        enclosure = item.find("enclosure")
        image = None
        if enclosure is not None:
            img_url = (enclosure.get("url") or "").strip()
            mime = (enclosure.get("type") or "").lower()
            # RSS 的 enclosure 也会挂 .docx/.pdf 附件，不能一律当图片
            if img_url and (mime.startswith("image/") or img_url.lower().endswith(_IMAGE_EXT)):
                image = img_url

        if not title:
            continue

        items.append({
            "guid": guid or hashlib.sha1(link.encode()).hexdigest()[:16],
            "title": title,
            "link": link,
            "pubDate": pub_dt,
            "description": description,
            "categories": [c for c in categories if c],
            "image": image,
        })
    return items


# ---------------------------------------------------------------- 归一化


def guess_time_fields(description: str, pub_dt: datetime) -> dict[str, Any]:
    """
    从中文描述里抽时间/地点/绩点。

    注意：这是启发式，不是解析器。校园通知的写法千变万化（“本周五”“下周三”“暂定”），
    这里只处理“X月X日 + 时间段”这类最常见写法，结果一律带 _hint 后缀，
    下游必须允许为空，不能当主键或排序依据用。
    """
    out: dict[str, Any] = {
        "startTime_hint": None,
        "timeRange_hint": None,
        "location_hint": None,
        "credits_hint": None,
    }

    # 逐个候选日期检查上下文，跳过“报名截止”这类非活动时间
    chosen: tuple[re.Match, re.Match | None, str] | None = None
    for dm in _DATE_RE.finditer(description):
        before = description[max(0, dm.start() - 14): dm.start()]
        after = description[dm.end(): dm.end() + 30]
        if any(w in before for w in _DEADLINE_WORDS) or any(
            w in after[:8] for w in ("截止", "之前", "补充", "更新")
        ):
            continue
        hm = _HM_RE.search(after)
        # “20:00 前”同样是报名截止，不是活动开始
        if hm and after[hm.end(): hm.end() + 2].startswith("前"):
            continue
        chosen = (dm, hm, after)
        break

    if chosen:
        dm, hm, after = chosen
        month, day = int(dm.group(1)), int(dm.group(2))
        # 通知里通常不写年份，用发布年份；若月份明显早于发布月（跨年场景），顺延一年
        year = pub_dt.year
        if month < pub_dt.month - 6:
            year += 1
        hour = int(hm.group(1)) if hm else 0
        minute = int(hm.group(2)) if hm else 0
        try:
            start = datetime(year, month, day, hour, minute, tzinfo=CST)
            out["startTime_hint"] = start.isoformat()
        except ValueError:
            pass   # 2月30日这类脏数据直接放弃，不猜

        range_match = _RANGE_RE.search(after)   # 时间段必须贴着这个日期，避免张冠李戴
        if range_match:
            out["timeRange_hint"] = (
                f"{int(range_match.group(1)):02d}:{range_match.group(2)}"
                f"-{int(range_match.group(3)):02d}:{range_match.group(4)}"
            )

    loc = _LOCATION_RE.search(description)
    if loc:
        out["location_hint"] = loc.group(1)

    credit = _CREDIT_RE.search(description)
    if credit:
        try:
            out["credits_hint"] = float(credit.group(1))
        except ValueError:
            pass

    return out


def make_content_hash(title: str, start_time: str | None) -> str:
    """
    去重哈希 = SHA256(归一化标题 + 开始时间)。
    与 SRS 表 24 的 content_hash 口径一致：解决“同一活动换了链接又重新发”。
    """
    norm = _WS_RE.sub("", unicodedata.normalize("NFKC", title)).lower()
    return hashlib.sha256(f"{norm}|{start_time or ''}".encode("utf-8")).hexdigest()


def to_notices(raw_items: list[dict[str, Any]], now: datetime | None = None) -> list[Notice]:
    now = now or datetime.now(timezone.utc)
    result: list[Notice] = []
    for it in raw_items:
        hints = guess_time_fields(it["description"], it["pubDate"])
        result.append(Notice(
            sourceUrl=it["link"],
            title=it["title"],
            description=it["description"],
            publishedAt=it["pubDate"].isoformat(),
            organizer=it["categories"][0] if it["categories"] else None,
            categories=it["categories"],
            image=it["image"],
            contentHash=make_content_hash(it["title"], hints["startTime_hint"]),
            fetchedAt=now.isoformat(),
            **hints,
        ))
    return result


def dedupe(notices: list[Notice]) -> tuple[list[Notice], int]:
    """按 sourceUrl 去重，再按 contentHash 去重（两层，与抓取器设计一致）。"""
    seen_url: set[str] = set()
    seen_hash: set[str] = set()
    kept: list[Notice] = []
    for n in notices:
        if n.sourceUrl in seen_url:
            continue
        if n.contentHash in seen_hash:
            continue
        seen_url.add(n.sourceUrl)
        seen_hash.add(n.contentHash)
        kept.append(n)
    return kept, len(notices) - len(kept)


# ---------------------------------------------------------------- 输出


def write_json(path: Path, notices: list[Notice], meta: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"meta": meta, "items": [asdict(n) for n in notices]}
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(path: Path, notices: list[Notice]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = ["sourceUrl", "title", "publishedAt", "organizer", "categories",
              "startTime_hint", "timeRange_hint", "location_hint", "credits_hint",
              "description", "image", "contentHash", "fetchedAt"]
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for n in notices:
            row = asdict(n)
            row["categories"] = "|".join(n.categories)   # 列表压成字符串，Excel 可读
            writer.writerow({k: row.get(k) for k in fields})


# ---------------------------------------------------------------- 入口


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="抓取 JXNU PUBLISH 通知（RSS 源）")
    parser.add_argument("--url", default=BASE_URL + RSS_PATH, help="RSS 地址")
    parser.add_argument("--out", default="jxnu_notices.json", help="输出文件路径")
    parser.add_argument("--format", choices=("json", "csv"), default="json")
    parser.add_argument("--limit", type=int, default=0, help="只输出前 N 条（0=全部）")
    parser.add_argument("--fixture", help="把原始 RSS 另存为测试快照")
    parser.add_argument("--no-dedupe", action="store_true", help="关闭去重，便于核对原始条数")
    args = parser.parse_args(argv)

    started = datetime.now(timezone.utc)
    session = make_session()

    try:
        xml_bytes, final_url = fetch_rss(session, args.url)
    except requests.RequestException as exc:
        print(f"[FATAL] 请求失败：{exc}", file=sys.stderr)
        return 2

    if args.fixture:
        Path(args.fixture).parent.mkdir(parents=True, exist_ok=True)
        Path(args.fixture).write_bytes(xml_bytes)
        print(f"[fixture] 原始 RSS 已存 {args.fixture}")

    try:
        raw_items = parse_rss(xml_bytes)
    except ValueError as exc:
        print(f"[FATAL] 解析失败：{exc}", file=sys.stderr)
        return 3

    notices = to_notices(raw_items)
    if not args.no_dedupe:
        notices, dup_count = dedupe(notices)
    else:
        dup_count = 0

    if args.limit > 0:
        notices = notices[: args.limit]

    elapsed = (datetime.now(timezone.utc) - started).total_seconds()
    meta = {
        "source": final_url,
        "fetchedAt": started.isoformat(),
        "rawCount": len(raw_items),
        "keptCount": len(notices),
        "duplicateCount": dup_count,
        "durationSec": round(elapsed, 2),
    }

    out_path = Path(args.out)
    if args.format == "csv":
        write_csv(out_path, notices)
    else:
        write_json(out_path, notices, meta)

    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"[OK] 写出 {len(notices)} 条 → {out_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
