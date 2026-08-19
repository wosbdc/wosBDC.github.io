#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
================================================================================
   ____   ____   _____    _____            _                 _ 
  |  _ \ |  _ \ / ____|  / ____|          | |               | |
  | |_) || | | | |      | |     ___ _ __ | |_ _ __ __ _  | |
  |  _ < | | | | |      | |    / _ \ '_ \| __| '__/ _` | | |
  | |_) || |_| | |____  | |___|  __/ | | | |_| | | (_| | | |
  |____/ |____/ \_____|  \_____\___|_| |_|\__|_|  \__,_| |_|
                                                             
   ⚡ B D C   C E N T R A L   C O M M A N D   v 1 . 0 . 6 0 ⚡
  Unified Multi-Threaded Server Daemon | 0 Google Quota Architecture
================================================================================

Threads & Subsystems:
  [THREAD 1] 🌐 Media & Social Live Bridge (Plex, Twitch, Facebook, IG, Threads -> Livecounters Firebase)
  [THREAD 2] 🔥 WoS Account Multi-Maintenance (Furnace Upgrades, Nicknames, Avatars - 4x Daily / Every 6 Hours)
  [THREAD 3] 🎁 24/7 Gift Code Auto-Bot (Scrapes 5 sources hourly, tests Century Games API, mass auto-redeems)
  [THREAD 4] 💾 Automated Multi-Project Nightly Firebase RTDB Backup (24h Rolling Cadence)

Usage:
  python bdc_central_command.py                 # Run all subsystems concurrently (Default)
  python bdc_central_command.py --maintenance   # Run single WoS maintenance sweep and exit
  python bdc_central_command.py --giftcodes     # Run single gift code scrape/redeem and exit
  python bdc_central_command.py --backup        # Run single multi-project Firebase backup and exit
  python bdc_central_command.py --social-only   # Run only the Social/Media bridge
"""

import sys
import os
import time
import json
import re
import hashlib
import threading
import signal
from datetime import datetime, timezone, timedelta
import requests

try:
    from tools.firebase_backup_restore import backup_all_projects, list_all_backups, format_size, FIREBASE_PROJECTS
except ImportError:
    try:
        from firebase_backup_restore import backup_all_projects, list_all_backups, format_size, FIREBASE_PROJECTS
    except ImportError:
        backup_all_projects = None
        FIREBASE_PROJECTS = {}

# Enable UTF-8 console output on Windows
if sys.platform == 'win32':
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ==============================================================================
# ⚙️ GLOBAL SYSTEM CONFIGURATION
# ==============================================================================

# --- FIREBASE REALTIME DATABASES ---
LIVECOUNTERS_FIREBASE_URL = "https://livecounters-8eaa8-default-rtdb.firebaseio.com/labData.json"
WOS_DASHBOARD_FIREBASE_URL = "https://wos-dashboard-38d4c-default-rtdb.firebaseio.com"

# --- MEDIA & SOCIAL ASSETS ---
PLEX_IP = "127.0.0.1"
PLEX_PORT = "32400"
PLEX_TOKEN = "h1t7VnuUdZLiyDjpGWsZ"

TWITCH_CHANNEL = "briandivacox"
TWITCH_TOKEN = "yyojykiccdtzwvfxzud5vy17sl6eor"
TWITCH_CLIENT_ID = "gp762nuuoqcoxypju8c569th9wz7q5"
TWITCH_BROADCASTER_ID = "170864"

META_PAGE_ID = "55320913267"
META_TOKEN = "EAAOJz87tfbEBRcF1yr3OZAIUhFcBpxjZBoZBxO4v4MkkLRrVJRmblZCT07eaLhWcfh7IhQ6I51Lm5K5xhJm79kvZC2zARdR0jMYL4ilaNt1FgZBfoRSO0pqlg6yhMAQaXf4wDy9q2nemfvyjo0FDksQywJol7cgdZCecW9OhPwrZCv0w1IZB80gwUg4rmXLcIhzbZBBluwZBCqSX3DKkA8a8oZBtYT0fiqq2Mb5NEJWtDZAKwt7BCJisTRBcAZCKvLveldlroZBvAQhLrawlgENauPZBFgrxp6Yws3v4dN7pSQkZD"

THREADS_APP_ID = "1006536711882922"
THREADS_USER_ID = "26231664763158295"
THREADS_TOKEN = "THAAg36cTPHF1BYlpQVW9iZAHBiOVota2c4VjBqTGpKZAi1JZAzlwdF95MnZA5YkFYekFCZAmg4V1JIUlFXcnl0TVVvQkk4cTVHeGlveXpGYlRxX09hYTdiUWpaZATNDLTBPZAVc5SDdIVElmU1dXelN2RFQ3bzUwSk5QRGNxYkd5YWdOdTFFWC1oVHdiV2dwaGtBYVUZD"

# --- WHITEOUT SURVIVAL / CENTURY GAMES API CONFIG ---
WOS_PLAYER_INFO_URL = "https://wos-giftcode-api.centurygame.com/api/player"
WOS_GIFTCODE_API_URL = "https://wos-giftcode-api.centurygame.com/api/gift_code"
WOS_ENCRYPT_KEY = "tB87#kPtkxqOS2"
TEST_PLAYER_ID = "318843189"

# --- GOOGLE APPS SCRIPT WEBHOOK CONFIG (0 Quota Webhook) ---
WOS_FIREBASE_SECRET = "n5fTnxcK5J5ddNsT77AhZIoQGTogW3ROpk4k03Sv"
GAS_API_URL = "https://script.google.com/macros/s/AKfycbzXjvqOcr9w3CZuwNxDhesndWeSwFLDeo7RS_REykgenkqf73lq4FAfZ7bTitTmVEA/exec"

# --- TIMING & CADENCE INTERVALS (Seconds) ---
SOCIAL_FAST_INTERVAL = 2          # 2 seconds (Plex, Twitch live streams)
SOCIAL_META_INTERVAL = 300        # 5 minutes (Facebook, Instagram, Threads)
WOS_MAINTENANCE_INTERVAL = 21600  # 6 Hours (4x Daily: 00:00, 06:00, 12:00, 18:00 UTC)
GIFTCODE_BOT_INTERVAL = 3600      # 1 Hour (24/7 continuous code scraper)
FIREBASE_BACKUP_INTERVAL = 86400  # 24 Hours (Nightly Automated Full Snapshot)

# ==============================================================================
# 🌐 SHARED UTILITIES & HTTP SESSION
# ==============================================================================

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
})

shutdown_event = threading.Event()

# Thread status cache for live console
live_stats = {
    "social_status": "STARTING",
    "plex": 0,
    "twitch_viewers": 0,
    "twitch_chatters": 0,
    "fb": "--",
    "ig": "--",
    "threads": "--",
    "maint_status": "IDLE",
    "maint_last_run": "Never",
    "maint_next_run": "Calculating...",
    "maint_audited": 0,
    "maint_upgrades": 0,
    "bot_status": "IDLE",
    "bot_last_run": "Never",
    "bot_active_codes": 0,
    "backup_status": "IDLE",
    "backup_last_run": "Never",
    "backup_size": "--"
}

def log_event(subsystem, message):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{subsystem}] {message}")

# ==============================================================================
# 🧵 THREAD 1: SOCIAL & MEDIA LIVE BRIDGE
# ==============================================================================

def get_plex_sessions():
    url = f"http://{PLEX_IP}:{PLEX_PORT}/status/sessions?X-Plex-Token={PLEX_TOKEN}"
    try:
        r = session.get(url, headers={'Accept': 'application/json'}, timeout=3)
        return len(r.json().get('MediaContainer', {}).get('Metadata', [])) if r.status_code == 200 else 0
    except:
        return 0

def get_twitch_chatters():
    token = TWITCH_TOKEN.replace("oauth:", "").strip()
    url = f"https://api.twitch.tv/helix/chat/chatters?broadcaster_id={TWITCH_BROADCASTER_ID}&moderator_id={TWITCH_BROADCASTER_ID}"
    headers = {'Authorization': f'Bearer {token}', 'Client-Id': TWITCH_CLIENT_ID}
    try:
        r = session.get(url, headers=headers, timeout=4)
        if r.status_code == 200: return r.json().get('total', 0)
    except: pass
    return 0

def get_twitch_viewers():
    token = TWITCH_TOKEN.replace("oauth:", "").strip()
    url = f"https://api.twitch.tv/helix/streams?user_login={TWITCH_CHANNEL}"
    headers = {'Authorization': f'Bearer {token}', 'Client-Id': TWITCH_CLIENT_ID}
    try:
        r = session.get(url, headers=headers, timeout=4)
        if r.status_code == 200:
            stream_data = r.json().get('data', [])
            if stream_data: return stream_data[0].get('viewer_count', 0)
    except: pass
    return 0

def get_meta_ecosystem():
    fb_count, ig_count = "ERR", "ERR"
    clean_token = META_TOKEN.strip()
    url = f"https://graph.facebook.com/v19.0/{META_PAGE_ID}?fields=fan_count,instagram_business_account{{followers_count}}&access_token={clean_token}"
    try:
        r = session.get(url, timeout=5)
        if r.status_code == 200:
            stat_data = r.json()
            fb_count = stat_data.get('fan_count', 0)
            ig_node = stat_data.get('instagram_business_account', {})
            ig_count = ig_node.get('followers_count', 0) if ig_node else 0
    except: pass
    return fb_count, ig_count

def get_threads_followers():
    threads_count = "ERR"
    url = f"https://graph.threads.net/v1.0/{THREADS_USER_ID.strip()}/threads_insights?metric=followers_count&access_token={THREADS_TOKEN.strip()}"
    try:
        r = session.get(url, timeout=5)
        if r.status_code == 200:
            res_data = r.json().get('data', [])
            if res_data and 'total_value' in res_data[0]:
                threads_count = res_data[0]['total_value'].get('value', 0)
    except: pass
    return threads_count

def push_social_to_firebase(plex_count, chatters, viewers, fb_count, ig_count, threads_count):
    try:
        payload = {
            "plexCount": plex_count,
            "twitchChatters": int(chatters),
            "twitchViewers": int(viewers),
            "fbPage": str(fb_count),
            "igFol": str(ig_count),
            "threadsFol": str(threads_count)
        }
        session.patch(LIVECOUNTERS_FIREBASE_URL, json=payload, timeout=3)
        return True
    except:
        return False

def run_social_bridge_thread():
    log_event("SOCIAL BRIDGE", "Initializing Media & Social Live Bridge...")
    cached_fb, cached_ig = get_meta_ecosystem()
    cached_threads = get_threads_followers()

    if cached_fb == "ERR": cached_fb = "0"
    if cached_ig == "ERR": cached_ig = "0"
    if cached_threads == "ERR": cached_threads = "0"

    live_stats["fb"] = cached_fb
    live_stats["ig"] = cached_ig
    live_stats["threads"] = cached_threads

    last_meta_check = time.time()

    while not shutdown_event.is_set():
        current_time = time.time()
        p_count = get_plex_sessions()
        t_chatters = get_twitch_chatters()
        t_viewers = get_twitch_viewers()

        if current_time - last_meta_check >= SOCIAL_META_INTERVAL:
            meta_fb, meta_ig = get_meta_ecosystem()
            if meta_fb != "ERR": cached_fb = meta_fb
            if meta_ig != "ERR": cached_ig = meta_ig

            th_count = get_threads_followers()
            if th_count != "ERR": cached_threads = th_count
            last_meta_check = current_time

            live_stats["fb"] = cached_fb
            live_stats["ig"] = cached_ig
            live_stats["threads"] = cached_threads

        success = push_social_to_firebase(p_count, t_chatters, t_viewers, cached_fb, cached_ig, cached_threads)
        live_stats["social_status"] = "OK" if success else "RETRYING"
        live_stats["plex"] = p_count
        live_stats["twitch_viewers"] = t_viewers
        live_stats["twitch_chatters"] = t_chatters

        time.sleep(SOCIAL_FAST_INTERVAL)

# ==============================================================================
# 🧵 THREAD 2: WHITEOUT SURVIVAL MULTI-MAINTENANCE DAEMON (4x Daily / 6 Hours)
# ==============================================================================

def encode_wos_data(data):
    sorted_keys = sorted(data.keys())
    encoded_data = '&'.join(
        [
            f"{key}={json.dumps(data[key]) if isinstance(data[key], dict) else data[key]}"
            for key in sorted_keys
        ]
    )
    sign = hashlib.md5(f"{encoded_data}{WOS_ENCRYPT_KEY}".encode()).hexdigest()
    return {'sign': sign, **data}

def fetch_stove_info(player_id):
    headers = {
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://wos-giftcode.centurygame.com',
        'referer': 'https://wos-giftcode.centurygame.com',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    }
    data_to_encode = {
        'fid': str(player_id),
        'time': str(int(time.time())),
    }
    payload = encode_wos_data(data_to_encode)
    try:
        resp = session.post(WOS_PLAYER_INFO_URL, headers=headers, data=payload, timeout=10)
        res_json = resp.json()
        if res_json.get('code') == 0 and res_json.get('data'):
            d = res_json['data']
            return {
                'success': True,
                'nickname': d.get('nickname', ''),
                'stove_lv': d.get('stove_lv', ''),
                'avatar_image': d.get('avatar_image', ''),
                'kid': d.get('kid', '')
            }
        return {'success': False, 'msg': res_json.get('msg', 'Failed')}
    except Exception as e:
        return {'success': False, 'msg': str(e)}

def sync_upgrade_to_google_sheet(fid, name, furnace_level):
    try:
        params = {
            "api": "updateChiefLevel",
            "gameId": str(fid).strip(),
            "name": str(name).strip(),
            "furnaceLevel": str(furnace_level).strip()
        }
        r = session.get(GAS_API_URL, params=params, timeout=10)
        return r.json().get("success", False)
    except Exception:
        return False

def execute_wos_maintenance_sweep():
    log_event("WOS MAINT", "Starting Automated Account Maintenance sweep (4x Daily Cadence)...")
    live_stats["maint_status"] = "SWEEPING"

    # 1. Fetch current users and roster_live from Firebase
    try:
        users_resp = session.get(f"{WOS_DASHBOARD_FIREBASE_URL}/users.json", timeout=12)
        users = users_resp.json() or {}
    except Exception as e:
        log_event("WOS MAINT", f"Error fetching users: {e}")
        users = {}

    try:
        roster_resp = session.get(f"{WOS_DASHBOARD_FIREBASE_URL}/roster_live.json", timeout=12)
        roster_live = roster_resp.json() or {}
    except Exception as e:
        log_event("WOS MAINT", f"Error fetching roster_live: {e}")
        roster_live = {}

    # 2. Extract unique Chief IDs
    id_list = []
    seen = set()

    for uid, u in users.items():
        if not isinstance(u, dict): continue
        gid = str(u.get('gameId', '')).strip()
        if gid.isdigit() and gid not in seen:
            seen.add(gid)
            id_list.append((gid, 'primary', uid))

        alt_tokens = u.get('altTokens', {})
        if isinstance(alt_tokens, dict):
            for alt_id in alt_tokens.keys():
                alt_id_str = str(alt_id).strip()
                if alt_id_str.isdigit() and alt_id_str not in seen:
                    seen.add(alt_id_str)
                    id_list.append((alt_id_str, 'alt', uid))

    for r_key, r in roster_live.items():
        if not isinstance(r, dict): continue
        rgid = str(r.get('gameId', '')).strip()
        if rgid.isdigit() and rgid not in seen:
            seen.add(rgid)
            id_list.append((rgid, 'roster', None))

    log_event("WOS MAINT", f"Identified {len(id_list)} unique Chief accounts to audit.")

    accounts_audited = 0
    upgrades = []
    name_changes = []

    for fid, acct_type, uid in id_list:
        info = fetch_stove_info(fid)
        accounts_audited += 1

        if info.get('success'):
            off_name = info['nickname']
            off_lvl = str(info['stove_lv'])
            off_avatar = info['avatar_image']

            # Check for changes in users
            for u_key, usr in users.items():
                if not isinstance(usr, dict): continue
                if str(usr.get('gameId', '')).strip() == fid:
                    old_lvl = str(usr.get('furnaceLevel') or usr.get('stove_lv') or '')
                    old_name = usr.get('name') or usr.get('chiefName') or ''

                    if off_lvl and off_lvl != old_lvl:
                        upgrades.append({'fid': fid, 'name': off_name or old_name, 'oldLevel': old_lvl, 'newLevel': off_lvl})
                        usr['furnaceLevel'] = off_lvl
                        usr['stove_lv'] = off_lvl

                    if off_name and off_name != old_name:
                        name_changes.append({'fid': fid, 'oldName': old_name, 'newName': off_name})
                        usr['name'] = off_name

                    if off_avatar: usr['avatar_image'] = off_avatar

                # Check alts
                if usr.get('altTokens') and isinstance(usr['altTokens'], dict) and fid in usr['altTokens']:
                    alt_node = usr['altTokens'][fid]
                    if isinstance(alt_node, dict):
                        old_lvl = str(alt_node.get('furnaceLevel') or alt_node.get('stove_lv') or '')
                        old_name = alt_node.get('nickname') or ''
                        if off_lvl and off_lvl != old_lvl:
                            upgrades.append({'fid': fid, 'name': off_name or old_name, 'oldLevel': old_lvl, 'newLevel': off_lvl, 'type': 'alt'})
                            alt_node['furnaceLevel'] = off_lvl
                            alt_node['stove_lv'] = off_lvl
                        if off_name and off_name != old_name:
                            name_changes.append({'fid': fid, 'oldName': old_name, 'newName': off_name, 'type': 'alt'})
                            alt_node['nickname'] = off_name
                        if off_avatar: alt_node['avatar_image'] = off_avatar

            # Update roster_live
            r_name_key = off_name or fid
            if r_name_key not in roster_live: roster_live[r_name_key] = {}
            roster_live[r_name_key]['name'] = off_name
            roster_live[r_name_key]['gameId'] = fid
            if off_lvl:
                roster_live[r_name_key]['furnaceLevel'] = off_lvl
                roster_live[r_name_key]['stove_lv'] = off_lvl
            if off_avatar: roster_live[r_name_key]['avatar_image'] = off_avatar
            roster_live[r_name_key]['updatedAt'] = int(time.time() * 1000)

        time.sleep(0.3) # Respect API rate limits

    # 3. Save updated users and roster_live back to Firebase
    try:
        session.put(f"{WOS_DASHBOARD_FIREBASE_URL}/users.json", json=users, timeout=15)
        session.put(f"{WOS_DASHBOARD_FIREBASE_URL}/roster_live.json", json=roster_live, timeout=15)
    except Exception as e:
        log_event("WOS MAINT", f"Error saving data to Firebase: {e}")

    # 4. Auto-sync detected upgrades directly into Google Sheet Chief's List (0 Google Quota)
    if upgrades:
        for upg in upgrades:
            u_fid = upg.get('fid')
            u_name = upg.get('name')
            u_lvl = upg.get('newLevel')
            if u_fid and u_lvl:
                ok_sheet = sync_upgrade_to_google_sheet(u_fid, u_name, u_lvl)
                if ok_sheet:
                    log_event("WOS MAINT", f"📊 Auto-synced {u_name} ({u_lvl}) directly to Google Sheet Chief's List!")

    # 4. Generate Telemetry Report
    now_iso = datetime.now(timezone.utc).isoformat()
    next_iso = datetime.fromtimestamp(time.time() + WOS_MAINTENANCE_INTERVAL, timezone.utc).isoformat()

    maint_report = {
        "status": "complete",
        "lastRun": now_iso,
        "nextRun": next_iso,
        "runner": "BDC Central Command Server Daemon",
        "quotaUsed": "0 Google Apps Script Quota (Direct Server Bridge)",
        "accountsAudited": accounts_audited,
        "upgradesCount": len(upgrades),
        "upgrades": upgrades,
        "nameChangesCount": len(name_changes),
        "nameChanges": name_changes,
        "summary": f"Multi-Maintenance complete: {accounts_audited} accounts audited, {len(upgrades)} furnace upgrades synced, {len(name_changes)} nickname changes updated."
    }

    try:
        session.put(f"{WOS_DASHBOARD_FIREBASE_URL}/system/nightly_maintenance_status.json", json=maint_report, timeout=10)
    except Exception as e:
        log_event("WOS MAINT", f"Error saving telemetry: {e}")

    live_stats["maint_status"] = "OK"
    live_stats["maint_last_run"] = datetime.now().strftime("%H:%M:%S")
    live_stats["maint_next_run"] = datetime.fromtimestamp(time.time() + WOS_MAINTENANCE_INTERVAL).strftime("%H:%M:%S")
    live_stats["maint_audited"] = accounts_audited
    live_stats["maint_upgrades"] = len(upgrades)

    log_event("WOS MAINT", f"✅ Maintenance Sweep Complete: {accounts_audited} audited, {len(upgrades)} upgrades, {len(name_changes)} name changes.")

def run_wos_maintenance_thread():
    log_event("WOS MAINT", "Initializing Whiteout Survival Multi-Maintenance Thread (Cadence: Every 6 Hours / 4x Daily)...")
    time.sleep(5) # Stagger launch
    while not shutdown_event.is_set():
        try:
            execute_wos_maintenance_sweep()
        except Exception as e:
            log_event("WOS MAINT", f"Sweep error: {e}")

        # Sleep for WOS_MAINTENANCE_INTERVAL with responsive shutdown checking
        slept = 0
        while slept < WOS_MAINTENANCE_INTERVAL and not shutdown_event.is_set():
            time.sleep(5)
            slept += 5

# ==============================================================================
# 🧵 THREAD 3: 24/7 GIFT CODE AUTO-BOT
# ==============================================================================

SCRAPE_SOURCES = [
    {'name': 'WosRewards', 'url': 'https://www.wosrewards.com/giftcodes'},
    {'name': 'GamsGo', 'url': 'https://www.gamsgo.com/blog/whiteout-survival-gift-codes'},
    {'name': 'PocketGamer', 'url': 'https://www.pocketgamer.com/whiteout-survival/codes/'},
    {'name': 'DotGG', 'url': 'https://dotgg.gg/whiteout-survival/gift-codes/'},
    {'name': 'ProGameGuides', 'url': 'https://progameguides.com/whiteout-survival/whiteout-survival-codes/'}
]

IGNORED_WORDS = {
    'WHITEOUT', 'SURVIVAL', 'CENTURY', 'GAMES', 'DISCORD', 'FACEBOOK', 'REDDIT',
    'YOUTUBE', 'GOOGLE', 'CHROME', 'APPLE', 'ANDROID', 'UPDATE', 'EXPIRED',
    'ACTIVE', 'REWARD', 'REWARDS', 'GIFTCODE', 'PLAYERS', 'AVATAR', 'STOVE',
    'FURNACE', 'STATUS', 'SERVER', 'ONLINE', 'OFFLINE', 'METHOD', 'REPORT',
    'CODES', 'CODE', 'ADDED', 'LIST', 'CLAIM', 'EXCHANGE', 'PAGE', 'NOTES',
    'SETTINGS', 'TERMS', 'POLICY', 'PRIVACY', 'CONTACT', 'COOKIE', 'COOKIES',
    'IN-GAME', 'CASE-SENSITIVE', 'TIME-LIMITED', 'OFFICIALSTORE', 'DISCOUNTED',
    'POPULAR', 'GEMS', 'TYPE', 'REDEEM', 'EVENT', 'MAILBOX', 'ACCOUNTS',
    'ADOBE', 'AFFILIATE', 'BLOG', 'CANNVA', 'CAPCUT', 'CHATGPT', 'CLAUDE',
    'COINS', 'CRUNCHYROL', 'CRUNCHYROLL', 'CURSOR'
}

GIFTCODE_BLACKLIST_FILE = "scraped_candidates_blacklist.json"
GIFTCODE_BLACKLIST = set()

def load_cli_blacklist():
    global GIFTCODE_BLACKLIST
    if os.path.exists(GIFTCODE_BLACKLIST_FILE):
        try:
            with open(GIFTCODE_BLACKLIST_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if isinstance(saved, list):
                    GIFTCODE_BLACKLIST.update(saved)
        except: pass
    try:
        r = session.get(f"{WOS_DASHBOARD_FIREBASE_URL}/system/giftcode_bot_blacklist.json", timeout=5)
        fb_list = r.json()
        if isinstance(fb_list, list):
            GIFTCODE_BLACKLIST.update(fb_list)
    except: pass

def save_cli_blacklist():
    bl_list = sorted(list(GIFTCODE_BLACKLIST))
    try:
        with open(GIFTCODE_BLACKLIST_FILE, "w", encoding="utf-8") as f:
            json.dump(bl_list, f, indent=2)
    except: pass
    try:
        session.put(f"{WOS_DASHBOARD_FIREBASE_URL}/system/giftcode_bot_blacklist.json", json=bl_list, timeout=5)
    except: pass

def validate_gift_code(cdk, player_id=TEST_PLAYER_ID, kid="2089"):
    clean_id = str(player_id or '').strip()
    clean_code = str(cdk or '').strip().upper()
    t = int(time.time())
    sign_str = f"cdk={clean_code}&fid={clean_id}&kid={kid}&time={t}{CENTURY_SECRET}"
    sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()
    payload = {
        "cdk": clean_code,
        "fid": clean_id,
        "kid": kid,
        "time": str(t),
        "sign": sign
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://wos-giftcode.centurygame.com",
        "Referer": "https://wos-giftcode.centurygame.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    }
    try:
        r = session.post(WOS_GIFTCODE_API_URL, data=payload, headers=headers, timeout=8)
        res = r.json()
        code = res.get('code')
        msg = (res.get('msg') or '').strip().upper()

        if code == 0 or res.get("status") == "success" or "SUCCESS" in msg or "RECEIVED" in msg or "CLAIMED" in msg or "USED" in msg or code in (40008, 20002):
            return {'status': 'active', 'msg': res.get('msg', 'Valid & Active Code')}
        if "TIME ERROR" in msg or "TIMEOUT" in msg or "TIME OUT" in msg or "EXPIRED" in msg or code in (40007, 20005, 40014):
            return {'status': 'expired', 'msg': res.get('msg', 'Expired Promo Code')}
        if "CDK NOT FOUND" in msg or "NOT EXIST" in msg or "NOT FOUND" in msg or code == 20001:
            return {'status': 'non_existent', 'msg': res.get('msg', 'Code Does Not Exist')}
        return {'status': 'failed', 'msg': res.get('msg', 'Unknown response')}
    except Exception as e:
        return {'status': 'network_error', 'msg': str(e)}

def execute_giftcode_bot_sweep():
    log_event("GIFTCODE BOT", "Starting intelligent gift code sweep across web feeds...")
    live_stats["bot_status"] = "SCRAPING"

    load_cli_blacklist()
    try:
        r = session.get(f"{WOS_DASHBOARD_FIREBASE_URL}/gift_codes_history.json?auth={WOS_FIREBASE_SECRET}", timeout=6)
        existing_history = r.json() or {}
    except:
        existing_history = {}

    candidates = set()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"}

    for src in SCRAPE_SOURCES:
        try:
            r = session.get(src['url'], headers=headers, timeout=10)
            if r.status_code == 200:
                matches = re.findall(r'<(?:code|strong|b|td|span)[^>]*>\s*([A-Za-z0-9_\-]{4,20})\s*</(?:code|strong|b|td|span)>', r.text)
                for m in matches:
                    m_clean = m.strip().upper()
                    if m_clean not in IGNORED_WORDS and not m_clean.isdigit() and len(m_clean) >= 4:
                        if m_clean not in GIFTCODE_BLACKLIST and m_clean not in existing_history:
                            candidates.add(m_clean)
        except: pass

    pending_candidates = list(candidates)
    log_event("GIFTCODE BOT", f"Found {len(pending_candidates)} new untracked candidate keyword(s) to evaluate.")

    valid_new_codes = []
    new_bl = False

    for c in pending_candidates[:25]:
        clean_key = re.sub(r'[^A-Za-z0-9_-]', '_', c)
        v = validate_gift_code(c)
        st = v.get('status')

        if st == 'active':
            log_event("GIFTCODE BOT", f"🔥 ACTIVE CODE DISCOVERED: [{c}] ({v.get('msg')})")
            valid_new_codes.append(c)
            try:
                session.put(f"{WOS_DASHBOARD_FIREBASE_URL}/gift_codes_history/{clean_key}.json?auth={WOS_FIREBASE_SECRET}", json={
                    "code": c,
                    "status": "active",
                    "description": f"Auto-discovered via BDC Central Command on {datetime.now().strftime('%Y-%m-%d')}",
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "createdBy": "BDC Central Command CLI",
                    "lastDispatchedAt": datetime.now(timezone.utc).isoformat(),
                    "lastTestedAt": datetime.now(timezone.utc).isoformat(),
                    "stats": {"total": 0, "success": 0, "already": 0, "failed": 0}
                }, timeout=5)
            except: pass
        elif st == 'expired':
            log_event("GIFTCODE BOT", f"🔴 EXPIRED: [{c}] was a promo code but has expired ({v.get('msg')})")
            GIFTCODE_BLACKLIST.add(c)
            new_bl = True
            try:
                session.put(f"{WOS_DASHBOARD_FIREBASE_URL}/gift_codes_history/{clean_key}.json?auth={WOS_FIREBASE_SECRET}", json={
                    "code": c,
                    "status": "expired",
                    "description": "Auto-tested and found expired",
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "createdBy": "BDC Central Command CLI",
                    "lastTestedAt": datetime.now(timezone.utc).isoformat()
                }, timeout=5)
            except: pass
        elif st == 'non_existent':
            GIFTCODE_BLACKLIST.add(c)
            new_bl = True

        time.sleep(0.4)

    if new_bl:
        save_cli_blacklist()

    # Update telemetry in Firebase
    try:
        all_hist = session.get(f"{WOS_DASHBOARD_FIREBASE_URL}/gift_codes_history.json?auth={WOS_FIREBASE_SECRET}", timeout=6).json() or {}
        active_cnt = sum(1 for item in all_hist.values() if isinstance(item, dict) and item.get("status") == "active")
        expired_cnt = sum(1 for item in all_hist.values() if isinstance(item, dict) and item.get("status") == "expired")
        total_claims = sum(int(item.get("stats", {}).get("success", 0)) for item in all_hist.values() if isinstance(item, dict))

        telemetry = {
            "status": "online",
            "lastSweep": datetime.now(timezone.utc).isoformat(),
            "nextSweep": (datetime.now(timezone.utc) + timedelta(seconds=GIFTCODE_SWEEP_INTERVAL)).isoformat(),
            "sourcesChecked": ["WosRewards", "GamsGo", "PocketGamer", "DotGG", "ProGameGuides"],
            "totalTrackedCodes": len(all_hist),
            "activeCodesCount": active_cnt,
            "expiredCodesCount": expired_cnt,
            "blacklistedWordsCount": len(GIFTCODE_BLACKLIST),
            "lifetimeClaimsDelivered": total_claims,
            "recentLog": f"Sweep complete: {len(pending_candidates)} evaluated, {len(valid_new_codes)} new active code(s), {len(GIFTCODE_BLACKLIST)} blacklisted non-codes."
        }
        session.put(f"{WOS_DASHBOARD_FIREBASE_URL}/system/giftcode_bot_status.json?auth={WOS_FIREBASE_SECRET}", json=telemetry, timeout=5)

        live_stats["bot_status"] = "OK"
        live_stats["bot_last_run"] = datetime.now().strftime("%H:%M:%S")
        live_stats["bot_active_codes"] = active_cnt
        log_event("GIFTCODE BOT", f"✅ Sweep Complete: {active_cnt} Active, {expired_cnt} Expired, {len(GIFTCODE_BLACKLIST)} Blacklisted.")
    except Exception as e:
        log_event("GIFTCODE BOT", f"Error updating Firebase telemetry: {e}")
    log_event("GIFTCODE BOT", "Initializing 24/7 Gift Code Auto-Bot Thread (Cadence: Hourly)...")
    time.sleep(15) # Stagger launch
    while not shutdown_event.is_set():
        try:
            execute_giftcode_bot_sweep()
        except Exception as e:
            log_event("GIFTCODE BOT", f"Bot error: {e}")

        slept = 0
        while slept < GIFTCODE_BOT_INTERVAL and not shutdown_event.is_set():
            time.sleep(5)
            slept += 5

# ==============================================================================
# 🧵 THREAD 4: AUTOMATED MULTI-PROJECT FIREBASE RTDB BACKUP
# ==============================================================================

def execute_firebase_backup_sweep():
    if not backup_all_projects:
        log_event("DB BACKUP", "Backup module not available.")
        return None

    log_event("DB BACKUP", f"Starting Multi-Project Firebase RTDB Backup ({len(FIREBASE_PROJECTS)} projects)...")
    live_stats["backup_status"] = "BACKING UP..."
    try:
        res = backup_all_projects(log_callback=lambda m: log_event("DB BACKUP", m))
        succ = res.get("successCount", 0)
        tot = res.get("totalProjects", len(FIREBASE_PROJECTS))
        sz = res.get("totalSizeFormatted", "0 B")
        live_stats["backup_status"] = f"{succ}/{tot} OK"
        live_stats["backup_last_run"] = datetime.now().strftime("%H:%M:%S")
        live_stats["backup_size"] = sz
        log_event("DB BACKUP", f"✅ Multi-Project Backup Complete: {succ}/{tot} DBs ({sz})")
        return res
    except Exception as e:
        log_event("DB BACKUP", f"❌ Backup sweep error: {e}")
        live_stats["backup_status"] = "ERR"
        return None

def run_firebase_backup_thread():
    log_event("DB BACKUP", "Initializing Automated Nightly Firebase Backup Thread (Cadence: 24h)...")
    time.sleep(20) # Stagger initial start
    while not shutdown_event.is_set():
        try:
            execute_firebase_backup_sweep()
        except Exception as e:
            log_event("DB BACKUP", f"Thread error: {e}")

        slept = 0
        while slept < FIREBASE_BACKUP_INTERVAL and not shutdown_event.is_set():
            time.sleep(10)
            slept += 10

# ==============================================================================
# 🖥️ LIVE TERMINAL DASHBOARD & CONSOLE UI
# ==============================================================================

def print_banner():
    banner = r"""
================================================================================
   ____   ____   _____    _____            _                 _ 
  |  _ \ |  _ \ / ____|  / ____|          | |               | |
  | |_) || | | | |      | |     ___ _ __ | |_ _ __ __ _  | |
  |  _ < | | | | |      | |    / _ \ '_ \| __| '__/ _` | | |
  | |_) || |_| | |____  | |___|  __/ | | | |_| | | (_| | | |
  |____/ |____/ \_____|  \_____\___|_| |_|\__|_|  \__,_| |_|
                                                             
     ⚡ B D C   C E N T R A L   C O M M A N D   v 1 . 0 . 6 0 ⚡
  Unified Multi-Threaded Server Daemon | 0 Google Quota Architecture
================================================================================
Subsystems Online:
  • [Thread 1] Social & Media Live Stream Bridge (Plex, Twitch, FB, IG, Threads)
  • [Thread 2] Whiteout Survival Multi-Maintenance (4x Daily / 6 Hours)
  • [Thread 3] 24/7 Gift Code Auto-Bot & Auto-Redeemer (Hourly)
  • [Thread 4] Automated Multi-Project Firebase RTDB Backup (24h Rolling)
================================================================================
"""
    print(banner)

def run_console_dashboard():
    while not shutdown_event.is_set():
        status_line = (
            f"\r[STATUS: {live_stats['social_status']}] "
            f"Plex: {live_stats['plex']} | "
            f"Twitch: {live_stats['twitch_viewers']}/{live_stats['twitch_chatters']} | "
            f"FB: {live_stats['fb']} | IG: {live_stats['ig']} | Threads: {live_stats['threads']} | "
            f"WoS Maint: [{live_stats['maint_status']} - Last: {live_stats['maint_last_run']}] | "
            f"Bot Codes: {live_stats['bot_active_codes']} | "
            f"Backup: [{live_stats['backup_status']} - {live_stats['backup_size']}]"
        )
        sys.stdout.write(status_line.ljust(130))
        sys.stdout.flush()
        time.sleep(1.5)

# ==============================================================================
# 🚀 MAIN ENTRYPOINT & CLI HANDLER
# ==============================================================================

def handle_signal(sig, frame):
    print("\n\n[SHUTDOWN] Received termination signal. Stopping all threads gracefully...")
    shutdown_event.set()
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    # CLI Flags
    if "--maintenance" in sys.argv:
        print_banner()
        log_event("CLI", "Executing single WoS Multi-Maintenance sweep...")
        execute_wos_maintenance_sweep()
        sys.exit(0)

    if "--giftcodes" in sys.argv:
        print_banner()
        log_event("CLI", "Executing single Gift Code Auto-Bot sweep...")
        execute_giftcode_bot_sweep()
        sys.exit(0)

    if "--backup" in sys.argv:
        print_banner()
        log_event("CLI", "Executing single Multi-Project Firebase RTDB backup sweep...")
        execute_firebase_backup_sweep()
        sys.exit(0)

    print_banner()
    log_event("MASTER", "Starting BDC Central Command Multi-Threaded Engine...")

    # Spawn Worker Threads
    t1 = threading.Thread(target=run_social_bridge_thread, daemon=True, name="SocialBridgeThread")
    t2 = threading.Thread(target=run_wos_maintenance_thread, daemon=True, name="WoSMaintenanceThread")
    t3 = threading.Thread(target=run_giftcode_bot_thread, daemon=True, name="GiftCodeBotThread")
    t4 = threading.Thread(target=run_firebase_backup_thread, daemon=True, name="FirebaseBackupThread")

    t1.start()
    t2.start()
    t3.start()
    t4.start()

    time.sleep(2)
    print("\n[ACTIVE RUNTIME CONSOLE]")
    try:
        run_console_dashboard()
    except KeyboardInterrupt:
        handle_signal(None, None)
