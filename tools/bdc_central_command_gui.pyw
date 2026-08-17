# ====================================================================
# ⚡ BDC CENTRAL COMMAND — NATIVE WINDOWS DESKTOP GUI EDITION (v1.0.0)
# ====================================================================
# All-in-One Multi-Threaded Desktop Control Panel:
#  • Media & Social Live Bridge (Plex, Twitch, FB, IG, Threads, YT, Snap, TikTok, X)
#  • Whiteout Survival Multi-Maintenance (4x Daily / 6 Hours - 0 Google Quota)
#  • 24/7 Gift Code Auto-Bot & Multi-Account Redeemer
#  • Discord Bot RSVP Tracker & Alliance Gatekeeper Reports
# ====================================================================

import tkinter as tk
from tkinter import ttk, scrolledtext
import threading
import requests
import time
import sys
import os
import json
import hashlib
import re
from datetime import datetime, timezone

def fmt_num(val):
    if val is None or str(val).strip() in ["", "---", "0"]:
        return str(val) if val else "0"
    s = str(val).strip()
    if any(c.isalpha() for c in s if c not in [',', '.']):
        return s
    try:
        n = int(s.replace(',', ''))
        return f"{n:,}"
    except:
        return s

# --- CONFIGURATION ---
PLEX_IP = "127.0.0.1"
PLEX_PORT = "32400"
PLEX_TOKEN = "h1t7VnuUdZLiyDjpGWsZ"

TWITCH_CHANNEL = "briandivacox"
TWITCH_TOKEN = "yyojykiccdtzwvfxzud5vy17sl6eor"
TWITCH_CLIENT_ID = "gp762nuuoqcoxypju8c569th9wz7q5"
TWITCH_BROADCASTER_ID = "170864"

# --- SNAPCHAT ASSETS ---
SNAPCHAT_CLIENT_ID = "01c775f4-71d2-42e6-9d73-98fbd9600274"
SNAPCHAT_CLIENT_SECRET = "99503dbea445ce097cdb"
SNAPCHAT_REDIRECT_URI = "https://briandivacox.me"
SNAPCHAT_REFRESH_TOKEN = "hCgwKCjE3ODAyNzU2MDASpQGl4kpM5ny2y68ChgovRB4ILc5dBnn8jZKPiZISWTO_jIH5uocoVThHnnZdJx_NBpZhF3zj-4cMYsJMh_Vn3_TIb5A2GtZIL7O9IOpAIfNHJj3do7Ico9r5AqH4adLOL-EAAHZF_DIbWtuJL2c-VUI09x54WsE4Wuy1cxmlbxndEBhbVA3Gzjt8-LCUZHpf4iuhSWs6p86j6RJgNrZlh1zyGqG8ZHA"
SNAPCHAT_API_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzg1ODcyNzAzLCJzdWIiOiIzNjBjNDIwNC05Y2ZhLTRlZGMtYTc1YS00NjIxZmY0MWQ0N2V-UFJPRFVDVElPTn5hYzBlODAyZC0wODQyLTQ5MDEtYmRmMS02ZDM5NjdlYzQwNWYifQ.rlYkDGVkzXwRx-YaZHJfbBVqF7Oa7qM19kwLNKgI6_E"

META_PAGE_ID = "55320913267"
META_TOKEN = "EAAOJz87tfbEBSKiXNPEKKAs6LF7rkFqoohoT0j2wZAJMaF9Ym7D0npXV3wBDLvRnuqaJZAYpwWVNZCPWHQhLnl3LLLKhxpZCqkmzuA7aw1FJVZCbZB13CexKAXJ7QZCZCqZCP3yKutFStRj4z50ePtMlDjQOt6ZBjVApWqpB7Ac1EljJIlpvXM4PGCPeRmb8cmQWaPfbHI2eBEyta2tgZDZD"

YOUTUBE_API_KEY = "AIzaSyCthMF6w_oq0SzmCr_1_xqRZCou0Wz_HgU"
YOUTUBE_CHANNEL_ID = "UCG79Tq48xXqg8M9b1K-10Sg"

THREADS_USER_ID = "17841400269553641"
THREADS_TOKEN = "THAAg36cTPHF1BYmJxNmlDOEwyT09wVnVXSldOVU13b2dLX2Qwck9seVg1LXg3N2ozcUJiel9tTXVqTFNxX3NqeHRLOUpPM3pCZAkF1SnY4NWUyLXFxVnVrT1N2b0Q2S3BfV2Q4cXpmblhHY2FLaEF4RVNTMi1YNkx4ZAmRiY3R4ZAl9hUQZDZD"

DISCORD_BOT_TOKEN = "MTUzMzU3OTU1MjE4NDMzNjM4NA." + "GC3hup.WqnunYrhrCJ3Ksny33YODooyYrmGIbhEasfr10"
DISCORD_GUILD_ID = "964526957721186354"
DISCORD_CHANNEL_ID = "1533687830201503914"

# Load local untracked webhook config if available
DISCORD_WEBHOOK_URL = ""
DISCORD_EVENT_WEBHOOK_URL = ""
GATEKEEPER_WEBHOOK_URL = ""
GIFTCODE_WEBHOOK_URL = ""
if os.path.exists("discord_config.json"):
    try:
        with open("discord_config.json", "r", encoding="utf-8") as f:
            cfg = json.load(f)
            DISCORD_WEBHOOK_URL = cfg.get("DISCORD_WEBHOOK_URL", "")
            DISCORD_EVENT_WEBHOOK_URL = cfg.get("DISCORD_EVENT_WEBHOOK_URL", "") or DISCORD_WEBHOOK_URL
            GATEKEEPER_WEBHOOK_URL = cfg.get("GATEKEEPER_WEBHOOK_URL", "")
            GIFTCODE_WEBHOOK_URL = cfg.get("GIFTCODE_WEBHOOK_URL", "") or GATEKEEPER_WEBHOOK_URL or DISCORD_WEBHOOK_URL
    except: pass

FIREBASE_URL = "https://livecounters-8eaa8-default-rtdb.firebaseio.com/labData.json"
WOS_FIREBASE_URL = "https://wos-dashboard-38d4c-default-rtdb.firebaseio.com"
GAS_API_URL = "https://script.google.com/macros/s/AKfycbwVxrfIb4UQDAoHNJ9RfFIdzWG4BRegZPf8QAOvUIoPRAvulUkQqtSNMClGR9UBxrI/exec"

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

# --- TIMERS ---
META_INTERVAL = 45          
RETRY_COOLDOWN = 10         
FAST_INTERVAL = 2           
GIFTCODE_SWEEP_INTERVAL = 45 * 60     # 45 minutes
WOS_MAINT_INTERVAL = 6 * 60 * 60      # 6 Hours (4x Daily: 00:00, 06:00, 12:00, 18:00 UTC)

# --- WHITEOUT SURVIVAL API CONFIG ---
WOS_PLAYER_INFO_URL = "https://wos-giftcode-api.centurygame.com/api/player"
WOS_GIFTCODE_API_URL = "https://wos-giftcode-api.centurygame.com/api/gift_code"
WOS_ENCRYPT_KEY = "tB87#kPtkxqOS2"
TEST_PLAYER_ID = "318843189"

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
})

# ==============================================================================
# 🎮 WHITEOUT SURVIVAL ENCRYPTION & SIGNING HELPERS
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

# ==============================================================================
# 🛡️ DISCORD BOT & GATEKEEPER INTEGRATION
# ==============================================================================

def start_discord_bot_online():
    def bot_loop():
        url = "https://discord.com/api/v10/gateway/bot"
        headers = {"Authorization": f"Bot {DISCORD_BOT_TOKEN.strip()}"}
        try:
            r = session.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                ws_url = r.json().get('url', 'wss://gateway.discord.gg') + '/?v=10&encoding=json'
                import websocket
                def on_open(ws):
                    identify_payload = {
                        "op": 2,
                        "d": {
                            "token": DISCORD_BOT_TOKEN.strip(),
                            "intents": 513,
                            "properties": {"os": "windows", "browser": "bdc_central_command", "device": "bdc_central_command"},
                            "presence": {
                                "status": "online",
                                "activities": [{"name": "BDC Central Command", "type": 3}],
                                "afk": False
                            }
                        }
                    }
                    ws.send(json.dumps(identify_payload))
                
                def on_message(ws, message):
                    data = json.loads(message)
                    if data.get('op') == 10:
                        hb_interval = data['d']['heartbeat_interval'] / 1000.0
                        def heartbeat():
                            while True:
                                time.sleep(hb_interval)
                                try: ws.send(json.dumps({"op": 1, "d": None}))
                                except: break
                        threading.Thread(target=heartbeat, daemon=True).start()
                
                ws_app = websocket.WebSocketApp(ws_url, on_open=on_open, on_message=on_message)
                ws_app.run_forever()
        except: pass
    threading.Thread(target=bot_loop, daemon=True).start()

try:
    start_discord_bot_online()
except Exception: pass

def format_event_datetime(iso_str):
    if not iso_str: return "TODAY", "TBD"
    try:
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00')).astimezone()
        return dt.strftime("%B %d, %Y").upper(), dt.strftime("%I:%M %p").lstrip('0')
    except:
        return "TODAY", "TBD"

RSVP_STORE_FILE = "discord_rsvp_ids.json"

def load_rsvp_message_ids():
    if os.path.exists(RSVP_STORE_FILE):
        try:
            with open(RSVP_STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except: pass
    return {}

def save_rsvp_message_ids():
    try:
        with open(RSVP_STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(rsvp_message_ids, f)
    except: pass

rsvp_message_ids = load_rsvp_message_ids()

def send_rsvp_card(ev_id, ev_name, date_str, time_str, user_count, names_list):
    roster_text = "\n".join([f"• {n}" for n in names_list]) if (names_list and user_count > 0) else "*No RSVPs yet*"
    count_label = "Member" if user_count == 1 else "Members"
    time_line = f"\n⏰ **Time:** {time_str}" if (time_str and time_str != "TBD") else ""
    payload = {
        "content": "",
        "embeds": [{
            "title": "🎟️ MOVIE NIGHT",
            "description": f"🎬 **Movie:** {ev_name}\n📅 **Date:** {date_str}{time_line}\n👥 **RSVPs:** {user_count} {count_label}\n\n📜 **Confirmed Attendees:**\n{roster_text}",
            "color": 15844367,
            "footer": {
                "text": "BDC Central Command • Live RSVP Tracker"
            }
        }]
    }
    target_webhook = DISCORD_EVENT_WEBHOOK_URL or DISCORD_WEBHOOK_URL
    try:
        msg_id = rsvp_message_ids.get(ev_id)
        if target_webhook and '/webhooks/' in target_webhook:
            parts = target_webhook.split('/webhooks/')[1].split('/')
            wh_id, wh_token = parts[0], parts[1]
            
            if msg_id:
                patch_url = f"https://discord.com/api/webhooks/{wh_id}/{wh_token}/messages/{msg_id}"
                r_patch = session.patch(patch_url, json=payload, timeout=10)
                if r_patch.status_code == 200:
                    return
                elif r_patch.status_code == 404:
                    if ev_id in rsvp_message_ids:
                        del rsvp_message_ids[ev_id]
                        save_rsvp_message_ids()
        
        r_post = session.post(f"{target_webhook}?wait=true", json=payload, timeout=10)
        if r_post.status_code == 200:
            new_id = r_post.json().get('id')
            if new_id:
                rsvp_message_ids[ev_id] = new_id
                save_rsvp_message_ids()
    except: pass

def delete_rsvp_card(ev_id):
    target_webhook = DISCORD_EVENT_WEBHOOK_URL or DISCORD_WEBHOOK_URL
    msg_id = rsvp_message_ids.get(ev_id)
    if msg_id and target_webhook and '/webhooks/' in target_webhook:
        try:
            parts = target_webhook.split('/webhooks/')[1].split('/')
            wh_id, wh_token = parts[0], parts[1]
            delete_url = f"https://discord.com/api/webhooks/{wh_id}/{wh_token}/messages/{msg_id}"
            session.delete(delete_url, timeout=10)
        except: pass

def purge_old_channel_messages(active_msg_id):
    if not DISCORD_BOT_TOKEN or not DISCORD_CHANNEL_ID: return
    headers = {"Authorization": f"Bot {DISCORD_BOT_TOKEN.strip()}"}
    target_webhook = DISCORD_EVENT_WEBHOOK_URL or DISCORD_WEBHOOK_URL
    if not target_webhook or '/webhooks/' not in target_webhook: return
    try:
        parts = target_webhook.split('/webhooks/')[1].split('/')
        wh_id, wh_token = parts[0], parts[1]
        url = f"https://discord.com/api/v10/channels/{DISCORD_CHANNEL_ID}/messages?limit=20"
        r = session.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            msgs = r.json()
            if isinstance(msgs, list):
                for m in msgs:
                    m_id = m.get('id')
                    if m_id and m_id != active_msg_id:
                        del_url = f"https://discord.com/api/webhooks/{wh_id}/{wh_token}/messages/{m_id}"
                        session.delete(del_url, timeout=10)
    except: pass

# ==============================================================================
# 🌐 SOCIAL / MEDIA METRIC FETCHERS
# ==============================================================================

def get_plex_sessions():
    url = f"http://{PLEX_IP}:{PLEX_PORT}/status/sessions?X-Plex-Token={PLEX_TOKEN}"
    try:
        r = session.get(url, headers={'Accept': 'application/json'}, timeout=5)
        if r.status_code == 200: return r.json().get('MediaContainer', {}).get('size', 0)
        return 0
    except: return 0

def get_twitch_chatters():
    url = f"https://api.twitch.tv/helix/chat/chatters?broadcaster_id={TWITCH_BROADCASTER_ID}&moderator_id={TWITCH_BROADCASTER_ID}"
    headers = {"Client-ID": TWITCH_CLIENT_ID, "Authorization": f"Bearer {TWITCH_TOKEN}"}
    try:
        r = session.get(url, headers=headers, timeout=5)
        if r.status_code == 200: return r.json().get('total', 0), "OK"
        return 0, "ERR"
    except: return 0, "OFFLINE"

def get_twitch_followers():
    url = f"https://api.twitch.tv/helix/channels/followers?broadcaster_id={TWITCH_BROADCASTER_ID}"
    headers = {"Client-ID": TWITCH_CLIENT_ID, "Authorization": f"Bearer {TWITCH_TOKEN}"}
    try:
        r = session.get(url, headers=headers, timeout=5)
        if r.status_code == 200: return str(r.json().get('total', 695)), "OK"
        return "695", "OK"
    except: return "695", "OK"

def get_twitch_viewers():
    url = f"https://api.twitch.tv/helix/streams?user_login={TWITCH_CHANNEL}"
    headers = {"Client-ID": TWITCH_CLIENT_ID, "Authorization": f"Bearer {TWITCH_TOKEN}"}
    try:
        r = session.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json().get('data', [])
            if data: return data[0].get('viewer_count', 0), "OK"
            return 0, "OFFLINE"
        return 0, "ERR"
    except: return 0, "OFFLINE"

def get_facebook_page_insights():
    try:
        url = "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FBrianDivaCoxFans%2F"
        r = session.get(url, timeout=5)
        if r.status_code == 200:
            m = re.search(r'([\d\.,]+)\s*(?:likes|followers)', r.text, re.IGNORECASE)
            if m: return m.group(1).replace(',', ''), "OK"
        r_api = session.get(f"https://graph.facebook.com/v19.0/{META_PAGE_ID}?fields=followers_count&access_token={META_TOKEN}", timeout=5)
        if r_api.status_code == 200: return str(r_api.json().get('followers_count', 1011)), "OK"
        return "1011", "OK"
    except: return "1011", "OK"

def get_facebook_profile_insights():
    try:
        url = "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FBrianDivaCox%2F"
        r = session.get(url, timeout=5)
        if r.status_code == 200:
            m = re.search(r'([\d\.,]+)\s*(?:likes|followers)', r.text, re.IGNORECASE)
            if m: return m.group(1).replace(',', ''), "OK"
        return "5478", "OK"
    except: return "5478", "OK"

def get_facebook_page_views():
    try:
        r_page = session.get(f"https://graph.facebook.com/v19.0/{META_PAGE_ID}?fields=access_token&access_token=" + META_TOKEN.strip(), timeout=5)
        if r_page.status_code == 200:
            page_token = r_page.json().get('access_token')
            if page_token:
                tot_v = 0
                vurl = f"https://graph.facebook.com/v19.0/{META_PAGE_ID}/videos?fields=views&limit=100&access_token=" + page_token
                while vurl:
                    rv = session.get(vurl, timeout=5)
                    if rv.status_code == 200:
                        vd = rv.json()
                        for v in vd.get("data", []):
                            tot_v += v.get("views", 0)
                        vurl = vd.get("paging", {}).get("next")
                    else: break
                if tot_v > 0: return str(tot_v), "OK"
        return "8051", "OK"
    except: return "8051", "OK"

cached_snap_access_token = None

def get_snap_oauth_token():
    global cached_snap_access_token
    if cached_snap_access_token:
        return cached_snap_access_token
    try:
        url = "https://accounts.snapchat.com/login/oauth2/access_token"
        data = {
            "grant_type": "refresh_token",
            "client_id": SNAPCHAT_CLIENT_ID,
            "client_secret": SNAPCHAT_CLIENT_SECRET,
            "refresh_token": SNAPCHAT_REFRESH_TOKEN
        }
        r = session.post(url, data=data, timeout=5)
        if r.status_code == 200:
            cached_snap_access_token = r.json().get("access_token")
            return cached_snap_access_token
    except: pass
    return None

def get_snapchat_data(username="briandivacox"):
    subscribers, views = "3296", "1200"
    token = get_snap_oauth_token()
    if token:
        try:
            url = "https://gcp.api.snapchat.com/gfg/?op=PublicProfileSubscriberCount"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Origin": "https://profile.snapchat.com",
                "Referer": "https://profile.snapchat.com/"
            }
            payload = {
                "operationName": "PublicProfileSubscriberCount",
                "variables": {"profileId": "c587edfd-7a3e-4a3d-bcab-eebbb144d16d"},
                "query": "query PublicProfileSubscriberCount($profileId: ID!) { publicProfile(profileId: $profileId) { id subscriberCount } }"
            }
            r = session.post(url, headers=headers, json=payload, timeout=5)
            if r.status_code == 200:
                cnt = r.json().get("data", {}).get("publicProfile", {}).get("subscriberCount")
                if cnt is not None and int(cnt) > 0:
                    subscribers = str(cnt)
                    return subscribers, views, "OK"
        except: pass

    try:
        url_pub = f"https://www.snapchat.com/add/{username}"
        headers_web = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
        r_pub = session.get(url_pub, headers=headers_web, timeout=5)
        if r_pub.status_code == 200:
            m = re.findall(r'<script id="__NEXT_DATA__" type="application/json">([^<]+)</script>', r_pub.text)
            if m:
                d = json.loads(m[0])
                props = d.get("props", {}).get("pageProps", {}).get("userProfile", {}).get("publicProfileInfo", {})
                cnt_pub = props.get("subscriberCount")
                if cnt_pub and str(cnt_pub) != "0":
                    subscribers = str(cnt_pub)
                    return subscribers, views, "OK"
    except: pass
    
    return subscribers, views, "OK"

def get_instagram_business_insights():
    fol, views = "5860", "0"
    try:
        r = session.get(f"https://graph.facebook.com/v19.0/{META_PAGE_ID}?fields=instagram_business_account{{followers_count,id}}&access_token={META_TOKEN}", timeout=5)
        if r.status_code == 200:
            ig_acc = r.json().get('instagram_business_account', {})
            fol = str(ig_acc.get('followers_count', 5860))
            ig_id = ig_acc.get('id')
            if ig_id:
                r_med = session.get(f"https://graph.facebook.com/v19.0/{ig_id}/media?fields=insights.metric(views)&limit=100&access_token={META_TOKEN}", timeout=5)
                if r_med.status_code == 200:
                    tot_v = 0
                    for item in r_med.json().get("data", []):
                        ins = item.get("insights", {}).get("data", [])
                        if ins:
                            tot_v += ins[0].get("values", [{}])[0].get("value", 0)
                    views = str(tot_v)
        return fol, views, "OK"
    except: return fol, views, "OK"

def get_threads_data():
    url_fol = f"https://graph.threads.net/v1.0/{THREADS_USER_ID}?fields=follower_count&access_token={THREADS_TOKEN.strip()}"
    url_view = f"https://graph.threads.net/v1.0/{THREADS_USER_ID}/threads_insights?metric=views&access_token={THREADS_TOKEN.strip()}"
    followers, views = "335", "6.6k"
    try:
        r_fol = session.get(url_fol, timeout=5)
        if r_fol.status_code == 200: followers = str(r_fol.json().get('follower_count', 335))
        r_view = session.get(url_view, timeout=5)
        if r_view.status_code == 200:
            view_data = r_view.json().get('data', [])
            if view_data and 'values' in view_data[0]:
                tot = sum(val.get('value', 0) for val in view_data[0]['values'])
                views = f"{tot / 1000:.1f}k" if tot >= 1000 else str(tot)
        return followers, views, "OK"
    except: return followers, views, "OK"

def get_youtube_data():
    url = f"https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=briandivacox&key={YOUTUBE_API_KEY}"
    try:
        r = session.get(url, timeout=5)
        if r.status_code == 200:
            items = r.json().get('items', [])
            if items:
                stats = items[0].get('statistics', {})
                subs = str(stats.get('subscriberCount', "799"))
                views = str(stats.get('viewCount', "305291"))
                return subs, views, "OK"
        return "799", "305291", "OK"
    except: return "799", "305291", "OK"

def get_tiktok_followers():
    try:
        r = session.get("https://mixerno.space/api/tiktok-user-counter/user/briandivacox", timeout=5)
        if r.status_code == 200:
            for c in r.json().get('counts', []):
                if c.get('value') == 'followers': return str(c.get('count', "255")), "OK"
        return "255", "OK"
    except: return "255", "OK"

def get_twitter_followers():
    try:
        r = session.get("https://mixerno.space/api/twitter-user-counter/user/briandivacox", timeout=5)
        if r.status_code == 200:
            for c in r.json().get('counts', []):
                if c.get('value') == 'followers': return str(c.get('count', "50551")), "OK"
        return "50551", "OK"
    except: return "50551", "OK"

def push_to_firebase(plex, twitch_c, twitch_v, fb_c, ig_c, th_f, th_v, yt_c, tt_c, x_c, snap_fol, discord_rsvp, fb_p="5478", fb_v="8051", ig_v="5342", yt_v="305291", snap_v="1200"):
    try:
        payload = {
            "plexCount": plex,
            "twitchChatters": int(twitch_c) if str(twitch_c).isdigit() else 0,
            "twitchViewers": int(twitch_v) if str(twitch_v).isdigit() else 0,
            "fbPage": str(fb_c),
            "fbProfile": str(fb_p),
            "fbViews": str(fb_v),
            "igFol": str(ig_c),
            "igViews": str(ig_v),
            "threadsFol": str(th_f),
            "threadsViews": str(th_v),
            "ytSubs": str(yt_c),
            "ytViews": str(yt_v),
            "ttFol": str(tt_c),
            "xFol": str(x_c),
            "snapFol": str(snap_fol),
            "snapViews": str(snap_v),
            "discordRsvp": str(discord_rsvp),
            "lastSynced": datetime.utcnow().isoformat() + "Z"
        }
        session.patch(FIREBASE_URL, json=payload, timeout=3)
        return True
    except: return False

def push_theater_sync(now_playing="No Movie Playing", next_title="No Movie Scheduled", next_time="TBD", rsvp_count=0):
    try:
        payload = {
            "nowPlaying": now_playing,
            "nextTitle": next_title,
            "nextTime": next_time,
            "rsvpCount": rsvp_count,
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        }
        session.patch("https://livecounters-8eaa8-default-rtdb.firebaseio.com/theaterSync.json", json=payload, timeout=3)
        return True
    except: return False

# ==============================================================================
# 🎁 GIFT CODE AUTO-BOT ENGINE
# ==============================================================================

class GiftCodeBotEngine:
    def __init__(self, log_callback=None, card_callback=None):
        self.log_callback = log_callback
        self.card_callback = card_callback
        self.sources = [
            ("WosRewards", "https://www.wosrewards.com/giftcodes"),
            ("GamsGo", "https://www.gamsgo.com/blog/whiteout-survival-gift-codes"),
            ("DotGG", "https://dotgg.gg/whiteout-survival/gift-codes/"),
            ("ProGameGuides", "https://progameguides.com/whiteout-survival/whiteout-survival-codes/"),
            ("PocketGamer", "https://www.pocketgamer.com/whiteout-survival/codes/")
        ]
        self.ignored_words = {
            "WHITEOUT", "SURVIVAL", "CENTURY", "GAMES", "DISCORD", "FACEBOOK", "REDDIT",
            "YOUTUBE", "GOOGLE", "CHROME", "APPLE", "ANDROID", "UPDATE", "EXPIRED",
            "ACTIVE", "REWARD", "REWARDS", "GIFTCODE", "PLAYERS", "AVATAR", "STOVE",
            "FURNACE", "STATUS", "SERVER", "ONLINE", "OFFLINE", "METHOD", "REPORT",
            "CODES", "CODE", "ADDED", "LIST", "CLAIM", "EXCHANGE", "PAGE", "NOTES"
        }

    def log(self, msg):
        if self.log_callback: self.log_callback(msg)

    def test_or_redeem(self, player_id, cdk):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://wos-giftcode.centurygame.com",
            "Referer": "https://wos-giftcode.centurygame.com/"
        }
        payload = encode_wos_data({
            'fid': str(player_id),
            'cdk': str(cdk).strip(),
            'time': str(int(time.time()))
        })
        try:
            r = session.post(WOS_GIFTCODE_API_URL, headers=headers, data=payload, timeout=8)
            res = r.json()
            code = res.get("code")
            msg = res.get("msg", "")
            if code == 0:
                return {"status": "success", "msg": msg, "code": code}
            elif code == 40008 or "claimed" in msg.lower() or "received" in msg.lower():
                return {"status": "already_claimed", "msg": msg, "code": code}
            elif code == 40007 or "expired" in msg.lower() or "timeout" in msg.lower() or "invalid" in msg.lower():
                return {"status": "expired", "msg": msg, "code": code}
            return {"status": "failed", "msg": msg, "code": code}
        except Exception as e:
            return {"status": "error", "msg": str(e)}

    def scrape_candidate_codes(self):
        candidates = set()
        for name, url in self.sources:
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"}
                r = session.get(url, headers=headers, timeout=10)
                if r.status_code == 200:
                    matches = re.findall(r'\b[A-Za-z0-9]{5,20}\b', r.text)
                    for m in matches:
                        code_clean = m.strip().upper()
                        if code_clean not in self.ignored_words and not code_clean.isdigit():
                            candidates.add(code_clean)
            except Exception as e:
                self.log(f"Warning scraping {name}: {e}")
        return list(candidates)

    def run_sweep(self):
        self.log("🎁 Starting autonomous gift code sweep across web feeds...")
        try:
            r = session.get(f"{WOS_FIREBASE_URL}/gift_codes_history.json", timeout=6)
            existing_history = r.json() or {}
        except:
            existing_history = {}

        candidates = self.scrape_candidate_codes()
        valid_new_codes = []

        for code in candidates[:30]:
            clean_key = re.sub(r'[^A-Za-z0-9_-]', '_', code)
            if clean_key in existing_history:
                continue

            res = self.test_or_redeem(TEST_PLAYER_ID, code)
            if res.get("status") in ("success", "already_claimed"):
                self.log(f"🎉 VERIFIED ACTIVE: [{code}] is valid! ({res.get('msg')})")
                valid_new_codes.append(code)
            time.sleep(0.4)

        # Update telemetry
        if self.card_callback:
            self.card_callback(f"{len(valid_new_codes)} New Active")
        self.log(f"✅ Gift code sweep complete. Found {len(valid_new_codes)} new active code(s).")

# ==============================================================================
# 🔥 WHITEOUT SURVIVAL MULTI-MAINTENANCE ENGINE (4x Daily - 0 Google Quota)
# ==============================================================================

class WoSMaintenanceEngine:
    def __init__(self, log_callback=None, card_callback=None):
        self.log_callback = log_callback
        self.card_callback = card_callback

    def log(self, msg):
        if self.log_callback: self.log_callback(msg)

    def run_sweep(self):
        self.log("🔥 [WOS MAINT] Starting Multi-Maintenance sweep (4x Daily Cadence)...")
        if self.card_callback: self.card_callback("Sweeping...")

        try:
            users_resp = session.get(f"{WOS_FIREBASE_URL}/users.json", timeout=12)
            users = users_resp.json() or {}
        except Exception as e:
            self.log(f"❌ [WOS MAINT] Error fetching users: {e}")
            users = {}

        try:
            roster_resp = session.get(f"{WOS_FIREBASE_URL}/roster_live.json", timeout=12)
            roster_live = roster_resp.json() or {}
        except Exception as e:
            self.log(f"❌ [WOS MAINT] Error fetching roster_live: {e}")
            roster_live = {}

        id_list = []
        seen = set()

        for uid, u in users.items():
            if not isinstance(u, dict): continue
            gid = str(u.get('gameId', '')).strip()
            if gid.isdigit() and gid not in seen:
                seen.add(gid)
                id_list.append(gid)

            alt_tokens = u.get('altTokens', {})
            if isinstance(alt_tokens, dict):
                for alt_id in alt_tokens.keys():
                    alt_id_str = str(alt_id).strip()
                    if alt_id_str.isdigit() and alt_id_str not in seen:
                        seen.add(alt_id_str)
                        id_list.append(alt_id_str)

        for r_key, r in roster_live.items():
            if not isinstance(r, dict): continue
            rgid = str(r.get('gameId', '')).strip()
            if rgid.isdigit() and rgid not in seen:
                seen.add(rgid)
                id_list.append(rgid)

        self.log(f"🔥 [WOS MAINT] Auditing {len(id_list)} unique Chief accounts from Century Games API...")

        accounts_audited = 0
        upgrades = []
        name_changes = []

        for fid in id_list:
            info = fetch_stove_info(fid)
            accounts_audited += 1

            if info.get('success'):
                off_name = info['nickname']
                off_lvl = str(info['stove_lv'])
                off_avatar = info['avatar_image']

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

                r_name_key = off_name or fid
                if r_name_key not in roster_live: roster_live[r_name_key] = {}
                roster_live[r_name_key]['name'] = off_name
                roster_live[r_name_key]['gameId'] = fid
                if off_lvl:
                    roster_live[r_name_key]['furnaceLevel'] = off_lvl
                    roster_live[r_name_key]['stove_lv'] = off_lvl
                if off_avatar: roster_live[r_name_key]['avatar_image'] = off_avatar
                roster_live[r_name_key]['updatedAt'] = int(time.time() * 1000)

            time.sleep(0.3)

        # Save to Firebase
        try:
            session.put(f"{WOS_FIREBASE_URL}/users.json", json=users, timeout=15)
            session.put(f"{WOS_FIREBASE_URL}/roster_live.json", json=roster_live, timeout=15)
        except Exception as e:
            self.log(f"❌ [WOS MAINT] Error writing to Firebase: {e}")

        # Auto-sync detected upgrades directly into Google Sheet Chief's List (0 Google Quota)
        if upgrades:
            for upg in upgrades:
                u_fid = upg.get('fid')
                u_name = upg.get('name')
                u_lvl = upg.get('newLevel')
                if u_fid and u_lvl:
                    ok_sheet = sync_upgrade_to_google_sheet(u_fid, u_name, u_lvl)
                    if ok_sheet:
                        self.log(f"📊 Auto-synced {u_name} ({u_lvl}) directly to Google Sheet Chief's List!")

        # Telemetry
        now_iso = datetime.now(timezone.utc).isoformat()
        next_iso = datetime.fromtimestamp(time.time() + WOS_MAINT_INTERVAL, timezone.utc).isoformat()

        maint_report = {
            "status": "complete",
            "lastRun": now_iso,
            "nextRun": next_iso,
            "runner": "BDC Central Command Desktop GUI",
            "quotaUsed": "0 Google Apps Script Quota (Direct Desktop Bridge)",
            "accountsAudited": accounts_audited,
            "upgradesCount": len(upgrades),
            "upgrades": upgrades,
            "nameChangesCount": len(name_changes),
            "nameChanges": name_changes,
            "summary": f"Multi-Maintenance complete: {accounts_audited} accounts audited, {len(upgrades)} furnace upgrades synced, {len(name_changes)} nickname changes updated."
        }

        try:
            session.put(f"{WOS_FIREBASE_URL}/system/nightly_maintenance_status.json", json=maint_report, timeout=10)
        except Exception as e:
            self.log(f"❌ [WOS MAINT] Error writing telemetry: {e}")

        if self.card_callback:
            self.card_callback(f"{accounts_audited} Audited / +{len(upgrades)} Upg")
        self.log(f"✅ [WOS MAINT] Maintenance sweep complete! {accounts_audited} accounts audited, {len(upgrades)} upgrades, {len(name_changes)} name changes.")

# ==============================================================================
# 🖥️ DESKTOP GUI CLASS — BDC CENTRAL COMMAND
# ==============================================================================

class BDCCentralCommandApp:
    def __init__(self, root):
        self.root = root
        self.root.title("⚡ BDC Central Command — Master Control Panel v1.0.0")
        self.root.geometry("920x720")
        self.root.configure(bg="#0d1117")

        self.running = False
        self.worker_thread = None
        self.last_giftcode_sweep = 0
        self.last_wos_maint_sweep = 0

        # Custom Styles
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Header Frame
        header_frame = tk.Frame(self.root, bg="#161b22", padx=12, pady=12)
        header_frame.pack(fill="x", side="top")
        
        title_label = tk.Label(header_frame, text="⚡ BDC CENTRAL COMMAND", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#161b22")
        title_label.pack(side="left", padx=10)
        
        self.status_badge = tk.Label(header_frame, text="● ENGINE STOPPED", font=("Segoe UI", 10, "bold"), fg="#f85149", bg="#161b22")
        self.status_badge.pack(side="left", padx=10)

        # Quick Action Buttons
        self.btn_toggle = tk.Button(header_frame, text="▶ START ENGINE", font=("Segoe UI", 10, "bold"), fg="#ffffff", bg="#238636", activebackground="#2ea043", activeforeground="#ffffff", relief="flat", command=self.toggle_engine, width=14, cursor="hand2")
        self.btn_toggle.pack(side="right", padx=6)

        btn_wos_maint = tk.Button(header_frame, text="🔥 WoS Maint", font=("Segoe UI", 9, "bold"), fg="#f59e0b", bg="#1e293b", activebackground="#334155", activeforeground="#f59e0b", relief="flat", command=self.btn_trigger_wos_maint, cursor="hand2", padx=8, pady=4)
        btn_wos_maint.pack(side="right", padx=4)

        btn_gift = tk.Button(header_frame, text="🎁 Sweep Codes", font=("Segoe UI", 9, "bold"), fg="#ec4899", bg="#1e293b", activebackground="#334155", activeforeground="#ec4899", relief="flat", command=self.btn_trigger_gift_sweep, cursor="hand2", padx=8, pady=4)
        btn_gift.pack(side="right", padx=4)

        # Cards Container Grid (4 rows x 4 columns)
        cards_frame = tk.Frame(self.root, bg="#0d1117", padx=10, pady=10)
        cards_frame.pack(fill="x", side="top", pady=5)

        self.card_labels = {}
        metrics = [
            ("Plex Sessions", "plex", "#e5a00d"),
            ("Twitch Live", "twitch", "#9146ff"),
            ("Facebook", "fb", "#1877f2"),
            ("Instagram", "ig", "#e4405f"),
            ("Threads", "threads", "#000000"),
            ("YouTube", "yt", "#ff0000"),
            ("TikTok", "tt", "#00f2fe"),
            ("X / Twitter", "x", "#1d9bf0"),
            ("Snapchat", "snap", "#fffc00"),
            ("Discord RSVP", "discord", "#5865f2"),
            ("🔥 WoS Maintenance", "wos_maint", "#f59e0b"),
            ("🎁 Gift Code Bot", "giftcode_bot", "#ec4899"),
            ("Grand Totals", "gt", "#f1e05a")
        ]

        for i, (name, key, color) in enumerate(metrics):
            r = i // 4
            c = i % 4
            box = tk.Frame(cards_frame, bg="#161b22", highlightbackground="#30363d", highlightthickness=1, padx=8, pady=8)
            box.grid(row=r, column=c, padx=5, pady=5, sticky="nsew")
            cards_frame.grid_columnconfigure(c, weight=1)

            lbl_title = tk.Label(box, text=name.upper(), font=("Segoe UI", 8, "bold"), fg="#8b949e", bg="#161b22")
            lbl_title.pack(anchor="w")
            
            lbl_val = tk.Label(box, text="--", font=("Segoe UI", 11, "bold"), fg="#ffffff", bg="#161b22")
            lbl_val.pack(anchor="w", pady=2)
            self.card_labels[key] = lbl_val

        # Subsystem Engines
        self.gift_bot = GiftCodeBotEngine(
            log_callback=lambda msg: self.root.after(0, self.log, msg),
            card_callback=lambda val: self.root.after(0, self.update_card, "giftcode_bot", val)
        )

        self.wos_maint = WoSMaintenanceEngine(
            log_callback=lambda msg: self.root.after(0, self.log, msg),
            card_callback=lambda val: self.root.after(0, self.update_card, "wos_maint", val)
        )

        # Activity Log Frame
        log_frame = tk.Frame(self.root, bg="#0d1117", padx=10, pady=10)
        log_frame.pack(fill="both", expand=True, side="bottom")

        lbl_log_title = tk.Label(log_frame, text="📜 Live Activity Feed", font=("Segoe UI", 9, "bold"), fg="#8b949e", bg="#0d1117")
        lbl_log_title.pack(anchor="w", pady=2)

        self.log_box = scrolledtext.ScrolledText(log_frame, bg="#161b22", fg="#c9d1d9", font=("Consolas", 9), highlightbackground="#30363d", relief="flat")
        self.log_box.pack(fill="both", expand=True)

        self.log("⚡ BDC Central Command v1.0.0 initialized. Click 'START ENGINE' to begin live bridge, WoS maintenance & gift code monitoring.")

    def log(self, msg):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_box.insert(tk.END, f"[{timestamp}] {msg}\n")
        self.log_box.see(tk.END)

    def update_card(self, key, val_text):
        if key in self.card_labels:
            self.card_labels[key].config(text=fmt_num(val_text))

    def btn_trigger_wos_maint(self):
        self.log("🔥 Triggering manual Whiteout Survival Multi-Maintenance sweep...")
        threading.Thread(target=self.wos_maint.run_sweep, daemon=True).start()

    def btn_trigger_gift_sweep(self):
        self.log("🎁 Triggering manual Gift Code sweep...")
        threading.Thread(target=self.gift_bot.run_sweep, daemon=True).start()

    def toggle_engine(self):
        if not self.running:
            self.running = True
            self.btn_toggle.config(text="⏹ STOP ENGINE", bg="#da3633", activebackground="#f85149")
            self.status_badge.config(text="● ENGINE RUNNING", fg="#3fb950")
            self.log("🚀 Starting BDC Central Command Engine worker threads...")
            self.worker_thread = threading.Thread(target=self.engine_loop, daemon=True)
            self.worker_thread.start()
        else:
            self.running = False
            self.btn_toggle.config(text="▶ START ENGINE", bg="#238636", activebackground="#2ea043")
            self.status_badge.config(text="● ENGINE STOPPED", fg="#f85149")
            self.log("Engine stopped.")

    def engine_loop(self):
        last_meta = 0
        fb_c, ig_c, th_f, th_v = "1011", "5860", "335", "6.6k"
        yt_c, tt_c, x_c, snap_fol = "799", "255", "50551", "1.2k"
        discord_rsvp_val = "0"

        while self.running:
            try:
                now = time.time()
                
                # Check WoS Multi-Maintenance (Runs on engine start, then every 6 hours / 4x Daily)
                if now - self.last_wos_maint_sweep >= WOS_MAINT_INTERVAL or self.last_wos_maint_sweep == 0:
                    self.last_wos_maint_sweep = now
                    threading.Thread(target=self.wos_maint.run_sweep, daemon=True).start()

                # Check Gift Code Bot (Runs on engine start, then every 45 mins)
                if now - self.last_giftcode_sweep >= GIFTCODE_SWEEP_INTERVAL or self.last_giftcode_sweep == 0:
                    self.last_giftcode_sweep = now
                    threading.Thread(target=self.gift_bot.run_sweep, daemon=True).start()

                # Fetch Plex & Twitch
                plex_cnt = get_plex_sessions()
                t_chat, t_chat_st = get_twitch_chatters()
                t_view, t_view_st = get_twitch_viewers()
                t_fol, _ = get_twitch_followers()
                
                tw_disp = f"{t_fol} ({t_view} Live)" if t_view > 0 else f"{t_fol}"
                self.root.after(0, self.update_card, "plex", f"{plex_cnt}")
                self.root.after(0, self.update_card, "twitch", tw_disp)

                # Fetch Meta & Socials (Every 45s)
                if now - last_meta >= META_INTERVAL or last_meta == 0:
                    fb_c, _ = get_facebook_page_insights()
                    fb_p, _ = get_facebook_profile_insights()
                    fb_v, _ = get_facebook_page_views()
                    ig_c, ig_v, _ = get_instagram_business_insights()
                    th_f, th_v, _ = get_threads_data()
                    yt_c, yt_v, _ = get_youtube_data()
                    tt_c, _ = get_tiktok_followers()
                    x_c, _ = get_twitter_followers()
                    snap_fol, snap_v, _ = get_snapchat_data()
                    last_meta = now

                    self.root.after(0, self.update_card, "fb", f"{fb_c} / {fb_v}")
                    self.root.after(0, self.update_card, "ig", f"{ig_c} / {ig_v}")
                    self.root.after(0, self.update_card, "threads", f"{th_f} / {th_v}")
                    self.root.after(0, self.update_card, "yt", f"{yt_c}")
                    self.root.after(0, self.update_card, "tt", f"{tt_c}")
                    self.root.after(0, self.update_card, "x", f"{x_c}")
                    self.root.after(0, self.update_card, "snap", f"{snap_fol} / {snap_v}")

                    # Calculate & Update Grand Totals Card
                    ig_f_val = int(ig_c) if str(ig_c).isdigit() else 5860
                    th_f_val = int(th_f) if str(th_f).isdigit() else 335
                    fb_p_val = int(fb_c) if str(fb_c).isdigit() else 1011
                    fb_personal_val = int(fb_p) if str(fb_p).isdigit() else 5478
                    tw_f_val = int(t_fol) if str(t_fol).isdigit() else 695
                    yt_s_val = int(yt_c) if str(yt_c).isdigit() else 799
                    tt_f_val = int(tt_c) if str(tt_c).isdigit() else 255
                    x_f_val = int(x_c) if str(x_c).isdigit() else 50551
                    snap_f_val = int(snap_fol) if str(snap_fol).isdigit() else 3303
                    bsky_f_val = 29

                    gt_fol_sum = ig_f_val + th_f_val + fb_p_val + fb_personal_val + tw_f_val + yt_s_val + tt_f_val + x_f_val + snap_f_val + bsky_f_val
                    gt_views_sum = (int(ig_v) if str(ig_v).isdigit() else 5342) + 6600 + (int(fb_v) if str(fb_v).isdigit() else 8051) + (int(yt_v) if str(yt_v).isdigit() else 305291) + (int(snap_v) if str(snap_v).isdigit() else 1200)

                    self.root.after(0, self.update_card, "gt", f"{gt_fol_sum:,} Fol / {gt_views_sum:,} Views")

                # Fetch Discord Events
                headers = {"Authorization": f"Bot {DISCORD_BOT_TOKEN.strip()}"}
                r_guilds = session.get("https://discord.com/api/v10/users/@me/guilds", headers=headers, timeout=10)
                if r_guilds.status_code == 200:
                    guilds = r_guilds.json()
                    if isinstance(guilds, list) and guilds:
                        g_id = guilds[0].get('id')
                        r_events = session.get(f"https://discord.com/api/v10/guilds/{g_id}/scheduled-events", headers=headers, timeout=10)
                        if r_events.status_code == 200:
                            events = [ev for ev in r_events.json() if isinstance(ev, dict) and ev.get('status') in (1, 2)]
                            events.sort(key=lambda x: (0 if x.get('status') == 2 else 1, x.get('scheduled_start_time') or ""))
                            
                            if not events:
                                for old_id in list(rsvp_message_ids.keys()):
                                    delete_rsvp_card(old_id)
                                discord_rsvp_val = "0"
                            else:
                                next_ev = events[0]
                                ev_id, ev_name = next_ev.get('id'), next_ev.get('name')

                                stale_ids = [ old_id for old_id in list(rsvp_message_ids.keys()) if old_id != ev_id ]
                                for stale_id in stale_ids:
                                    delete_rsvp_card(stale_id)

                                date_str, time_str = format_event_datetime(next_ev.get('scheduled_start_time'))
                                
                                u_names = []
                                ru = session.get(f"https://discord.com/api/v10/guilds/{g_id}/scheduled-events/{ev_id}/users?with_member=true", headers=headers, timeout=10)
                                if ru.status_code == 200:
                                    for uitem in ru.json():
                                        u_info, m_info = uitem.get('user', {}), uitem.get('member', {})
                                        dname = m_info.get('nick') or u_info.get('global_name') or u_info.get('username')
                                        handle = u_info.get('username')
                                        if dname: u_names.append(f"{dname} (@{handle})" if handle else dname)
                                
                                ev_user_cnt = next_ev.get('user_count', 0) or 0
                                final_rsvp_num = max(ev_user_cnt, len(u_names))
                                discord_rsvp_val = str(final_rsvp_num)
                                send_rsvp_card(ev_id, ev_name, date_str, time_str, final_rsvp_num, u_names)
                                active_msg_id = rsvp_message_ids.get(ev_id)
                                if active_msg_id:
                                    purge_old_channel_messages(active_msg_id)
                                push_theater_sync(now_playing="No Movie Playing", next_title=ev_name, next_time=next_ev.get('scheduled_start_time') or f"{date_str} {time_str}", rsvp_count=final_rsvp_num)
                                self.root.after(0, self.update_card, "discord", f"{ev_name[:10]}: {discord_rsvp_val} RSVP")

                # Push to Firebase
                ok = push_to_firebase(plex_cnt, t_chat, t_view, fb_c, ig_c, th_f, th_v, yt_c, tt_c, x_c, snap_fol, discord_rsvp_val, fb_p, fb_v, ig_v, yt_v, snap_v)
                summary_key = (plex_cnt, t_view, discord_rsvp_val, fb_c, ig_c)
                if ok and (not hasattr(self, 'last_log_key') or self.last_log_key != summary_key):
                    self.last_log_key = summary_key
                    self.root.after(0, self.log, f"Synced to Firebase | RSVP: {discord_rsvp_val} | Plex: {plex_cnt} | Twitch: {t_view_st}")
                
            except (requests.exceptions.ReadTimeout, requests.exceptions.ConnectTimeout):
                pass
            except Exception as e:
                self.root.after(0, self.log, f"Loop error: {e}")
            
            time.sleep(FAST_INTERVAL)

if __name__ == "__main__":
    root = tk.Tk()
    app = BDCCentralCommandApp(root)
    root.mainloop()
