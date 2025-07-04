import os
import json
import time
import jwt
from functools import wraps
from flask import Flask, request, jsonify, render_template, redirect, make_response, send_from_directory
import requests
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

app = Flask(__name__)
SECRET_KEY = 'your-secret-key'

# 工具函数
def load_config():
    if os.path.exists('config.json'):
        with open('config.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "ADMIN_USERNAME": "admin",
        "ADMIN_PASSWORD": "password",
        "JWT_SECRET": SECRET_KEY,
        "TG_BOT_TOKEN": "",
        "TG_CHAT_ID": "",
        "NOTIFYX_API_KEY": "",
        "NOTIFICATION_TYPE": "notifyx"
    }

def save_config(cfg):
    with open('config.json', 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

def load_subscriptions():
    if os.path.exists('subscriptions.json'):
        with open('subscriptions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_subscriptions(subs):
    with open('subscriptions.json', 'w', encoding='utf-8') as f:
        json.dump(subs, f, ensure_ascii=False, indent=2)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('token')
        if not token:
            return redirect('/')
        try:
            jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except:
            return redirect('/')
        return f(*args, **kwargs)
    return decorated

@app.route('/')
def login_page():
    return render_template('login.html')

@app.route('/admin')
@token_required
def admin_page():
    return render_template('admin.html')

@app.route('/admin/config')
@token_required
def config_page():
    return render_template('config.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    config = load_config()
    username = data.get('username')
    password = data.get('password')
    if username == config['ADMIN_USERNAME'] and password == config['ADMIN_PASSWORD']:
        # 生成JWT
        token = jwt.encode({'username': username, 'iat': int(time.time())}, config['JWT_SECRET'], algorithm='HS256')
        resp = jsonify({'success': True})
        resp.set_cookie('token', token, httponly=True, samesite='Strict', max_age=86400)
        return resp
    else:
        return jsonify({'success': False, 'message': '用户名或密码错误'})

@app.route('/api/subscriptions', methods=['GET'])
def api_get_subscriptions():
    return jsonify(load_subscriptions())

@app.route('/api/subscriptions', methods=['POST'])
def api_add_subscription():
    subs = load_subscriptions()
    data = request.get_json()
    if not data.get('name') or not data.get('expiryDate'):
        return jsonify({'success': False, 'message': '缺少必填字段'}), 400
    new_sub = {
        'id': str(int(time.time() * 1000)),
        'name': data.get('name'),
        'customType': data.get('customType', ''),
        'startDate': data.get('startDate'),
        'expiryDate': data.get('expiryDate'),
        'periodValue': data.get('periodValue', 1),
        'periodUnit': data.get('periodUnit', 'month'),
        'reminderDays': data.get('reminderDays', 7),
        'notes': data.get('notes', ''),
        'isActive': data.get('isActive', True),
        'autoRenew': data.get('autoRenew', True),
        'createdAt': time.strftime('%Y-%m-%dT%H:%M:%S')
    }
    subs.append(new_sub)
    save_subscriptions(subs)
    return jsonify({'success': True, 'subscription': new_sub})

@app.route('/api/subscriptions/<sub_id>', methods=['GET'])
def api_get_subscription(sub_id):
    subs = load_subscriptions()
    for s in subs:
        if s['id'] == sub_id:
            return jsonify(s)
    return jsonify({}), 404

@app.route('/api/subscriptions/<sub_id>', methods=['PUT'])
def api_update_subscription(sub_id):
    subs = load_subscriptions()
    data = request.get_json()
    for i, s in enumerate(subs):
        if s['id'] == sub_id:
            subs[i].update(data)
            save_subscriptions(subs)
            return jsonify({'success': True, 'subscription': subs[i]})
    return jsonify({'success': False, 'message': '订阅不存在'}), 404

@app.route('/api/subscriptions/<sub_id>', methods=['DELETE'])
def api_delete_subscription(sub_id):
    subs = load_subscriptions()
    new_subs = [s for s in subs if s['id'] != sub_id]
    if len(new_subs) == len(subs):
        return jsonify({'success': False, 'message': '订阅不存在'}), 404
    save_subscriptions(new_subs)
    return jsonify({'success': True})

@app.route('/api/config', methods=['GET'])
def api_get_config():
    config = load_config()
    config.pop('JWT_SECRET', None)
    config.pop('ADMIN_PASSWORD', None)
    return jsonify(config)

@app.route('/api/config', methods=['POST'])
def api_save_config():
    config = load_config()
    data = request.get_json()
    config.update(data)
    save_config(config)
    return jsonify({'success': True})

@app.route('/api/test-notification', methods=['POST'])
def api_test_notification():
    config = load_config()
    data = request.get_json()
    notify_type = data.get('type')
    if notify_type == 'telegram':
        tg_token = data.get('TG_BOT_TOKEN') or config.get('TG_BOT_TOKEN')
        tg_chat_id = data.get('TG_CHAT_ID') or config.get('TG_CHAT_ID')
        if not tg_token or not tg_chat_id:
            return jsonify({'success': False, 'message': '请填写Telegram配置'}), 400
        msg = '这是一条测试通知，用于验证Telegram通知功能是否正常工作。'
        url = f'https://api.telegram.org/bot{tg_token}/sendMessage'
        try:
            resp = requests.post(url, json={
                'chat_id': tg_chat_id,
                'text': msg,
                'parse_mode': 'Markdown'
            }, timeout=10)
            result = resp.json()
            if result.get('ok'):
                return jsonify({'success': True, 'message': 'Telegram通知发送成功'})
            else:
                return jsonify({'success': False, 'message': 'Telegram通知发送失败: ' + str(result)})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Telegram请求异常: {e}'})
    elif notify_type == 'notifyx':
        api_key = data.get('NOTIFYX_API_KEY') or config.get('NOTIFYX_API_KEY')
        if not api_key:
            return jsonify({'success': False, 'message': '请填写NotifyX配置'}), 400
        url = f'https://www.notifyx.cn/api/v1/send/{api_key}'
        try:
            resp = requests.post(url, json={
                'title': '测试通知',
                'content': '这是一条测试通知，用于验证NotifyX通知功能是否正常工作。',
                'description': '测试NotifyX通知'
            }, timeout=10)
            result = resp.json()
            if result.get('status') == 'queued':
                return jsonify({'success': True, 'message': 'NotifyX通知发送成功'})
            else:
                return jsonify({'success': False, 'message': 'NotifyX通知发送失败: ' + str(result)})
        except Exception as e:
            return jsonify({'success': False, 'message': f'NotifyX请求异常: {e}'})
    else:
        return jsonify({'success': False, 'message': '未知通知类型'}), 400

def send_notify(sub, config, test=False):
    notify_type = config.get('NOTIFICATION_TYPE', 'notifyx')
    name = sub.get('name', '')
    custom_type = sub.get('customType', '其他')
    expiry = sub.get('expiryDate', '')
    notes = sub.get('notes', '')
    title = f"{'[测试]' if test else ''}订阅到期提醒: {name}"
    content = f"订阅名称: {name}\n类型: {custom_type}\n到期日: {expiry}\n备注: {notes}"
    if notify_type == 'telegram':
        tg_token = config.get('TG_BOT_TOKEN')
        tg_chat_id = config.get('TG_CHAT_ID')
        if not tg_token or not tg_chat_id:
            return False
        url = f'https://api.telegram.org/bot{tg_token}/sendMessage'
        try:
            resp = requests.post(url, json={
                'chat_id': tg_chat_id,
                'text': content,
                'parse_mode': 'Markdown'
            }, timeout=10)
            result = resp.json()
            return result.get('ok', False)
        except Exception:
            return False
    elif notify_type == 'notifyx':
        api_key = config.get('NOTIFYX_API_KEY')
        if not api_key:
            return False
        url = f'https://www.notifyx.cn/api/v1/send/{api_key}'
        try:
            resp = requests.post(url, json={
                'title': title,
                'content': content,
                'description': '订阅到期提醒' if not test else '测试通知'
            }, timeout=10)
            result = resp.json()
            return result.get('status') == 'queued'
        except Exception:
            return False
    return False

@app.route('/api/subscriptions/<sub_id>/test-notify', methods=['POST'])
def api_test_single_notify(sub_id):
    subs = load_subscriptions()
    config = load_config()
    sub = next((s for s in subs if s['id'] == sub_id), None)
    if not sub:
        return jsonify({'success': False, 'message': '未找到该订阅'}), 404
    ok = send_notify(sub, config, test=True)
    if ok:
        return jsonify({'success': True, 'message': '测试通知已发送'})
    else:
        return jsonify({'success': False, 'message': '通知发送失败'})

@app.route('/api/subscriptions/<sub_id>/toggle-status', methods=['POST'])
def api_toggle_subscription_status(sub_id):
    subs = load_subscriptions()
    data = request.get_json()
    for s in subs:
        if s['id'] == sub_id:
            s['isActive'] = data.get('isActive', True)
            save_subscriptions(subs)
            return jsonify({'success': True})
    return jsonify({'success': False, 'message': '订阅不存在'}), 404

def check_expiring_subscriptions():
    subs = load_subscriptions()
    config = load_config()
    now = time.time()
    updated = False
    for sub in subs:
        if not sub.get('isActive', True):
            continue
        expiry = sub.get('expiryDate')
        if not expiry:
            continue
        try:
            expiry_ts = time.mktime(time.strptime(expiry, '%Y-%m-%d'))
        except Exception:
            continue
        days_diff = int((expiry_ts - now) // 86400)
        reminder_days = int(sub.get('reminderDays', 7))
        # 到期且自动续订
        if days_diff < 0 and sub.get('autoRenew', True):
            period_value = int(sub.get('periodValue', 1))
            period_unit = sub.get('periodUnit', 'month')
            new_expiry = expiry_ts
            if period_unit == 'day':
                new_expiry += period_value * 86400
            elif period_unit == 'month':
                new_expiry += period_value * 30 * 86400
            elif period_unit == 'year':
                new_expiry += period_value * 365 * 86400
            sub['expiryDate'] = time.strftime('%Y-%m-%d', time.localtime(new_expiry))
            updated = True
        # 到期提醒
        if 0 <= days_diff <= reminder_days:
            send_notify(sub, config)
    if updated:
        save_subscriptions(subs)

scheduler = BackgroundScheduler()
scheduler.add_job(check_expiring_subscriptions, 'interval', hours=1)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# TODO: 实现API接口和通知推送等功能

if __name__ == '__main__':
    app.run(debug=True) 