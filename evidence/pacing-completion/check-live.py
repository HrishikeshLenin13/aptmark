"""Ephemeral guest-only live check; never uses an existing browser session."""
import argparse, http.cookiejar, json, urllib.request, urllib.error
p = argparse.ArgumentParser()
p.add_argument('--url', default='http://127.0.0.1:3000')
p.add_argument('--production', action='store_true')
a = p.parse_args()
base = a.url.rstrip('/')
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(endpoint, data=None):
    request = urllib.request.Request(base + '/api/' + endpoint, data=json.dumps(data).encode() if data is not None else None,
        headers={'Origin': base, 'Content-Type': 'application/json'})
    try:
        with opener.open(request, timeout=45) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)
assert call('session', {})[0] == 200
status, state = call('state')
assert status == 200
try:
    assert state['preview'] is (not a.production)
    assert state['inventory']['generated'] == 5749
    assert state['inventory']['rw'] == 949 and state['inventory']['math'] == 4800
    assert state['inventory']['published'] == 0
    status, started = call('exam/start', {'mode':'drill','section':'rw','count':5,'seconds':180})
    if a.production:
        assert status == 409, (status, started)
        assert started['error'] == 'There are not enough eligible questions for these filters. Try all difficulties or another skill.'
        assert call('state')[1]['exams'] == []
        print('production: preview=false; unpublished candidates excluded; start=409; sessions=0')
    else:
        assert status == 200, (status, started)
        exam_id = started['id']
        _, data = call('exam?id=' + exam_id)
        assert len(data['questions']) == 5 and all(q['section'] == 'rw' for q in data['questions'])
        assert all('correctAnswer' not in q and 'explanation' not in q for q in data['questions'])
        assert data['exam']['mode'] == 'drill' and 'review' not in data
        assert call('exam/submit', {'id':exam_id,'index':0})[0] == 200
        _, locked = call('exam?id=' + exam_id)
        assert locked['exam']['status'] == 'complete' and len(locked['review']) == 5
        assert locked['exam']['modules'][0]['correct'] == 0
        print('live: preview=true; inventory=5749/949 English/4800 Math; English set=5; keys hidden until locked; review=5')
finally:
    assert call('delete-account', {'confirmation':'DELETE'})[0] == 200
    print('ephemeral guest deleted; no learner history retained')
