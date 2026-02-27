/** Prompt templates keyed by gesture action name. Use {code} as the placeholder. */
export const PROMPT_TEMPLATES = {
  fix: 'Here is a function with a bug. Identify and fix it. Return only the corrected code with a one-line comment explaining the fix:\n\n{code}',
  explain:
    'Explain what this code does in 3 bullet points, written for a developer:\n\n{code}',
  commit:
    'Write a concise, conventional git commit message for the following change:\n\n{code}',
  test: 'Generate a complete pytest test file for this function. Include happy path, edge cases, and error cases:\n\n{code}',
};

/** Status messages shown in the output panel header while streaming. */
export const STATUS_MESSAGES = {
  fix: '▶ Fixing bug in selected code...',
  explain: '▶ Explaining selected code...',
  commit: '▶ Generating commit message...',
  test: '▶ Scaffolding test file...',
  stop: '⏹ Stream aborted.',
};

/** Demo code used when clipboard is unavailable or empty. */
export const FALLBACK_CODE = `class UserService:
    def __init__(self, db):
        self.db = db
        self.cache = {}

    def get_user(self, user_id):
        if user_id in self.cache:
            return self.cache[user_id]
        user = self.db.query("SELECT * FROM users WHERE id = " + user_id)
        self.cache[user_id] = user
        return user

    def delete_user(self, user_id):
        self.db.query("DELETE FROM users WHERE id = " + user_id)

    def get_active_users(self):
        users = self.db.query("SELECT * FROM users WHERE active = 1")
        return sorted(users, key=lambda u: u['last_login'])`;

/** Pre-baked response used when the network is down (demo survival). */
export const CACHED_FALLBACK = {
  fix: `class UserService:
    def __init__(self, db):
        self.db = db
        self.cache = {}

    def get_user(self, user_id):
        if user_id in self.cache:
            return self.cache[user_id]
        # fix: use parameterized query to prevent SQL injection
        user = self.db.query("SELECT * FROM users WHERE id = %s", (user_id,))
        self.cache[user_id] = user
        return user

    def delete_user(self, user_id):
        # fix: use parameterized query + invalidate cache
        self.db.query("DELETE FROM users WHERE id = %s", (user_id,))
        self.cache.pop(user_id, None)

    def get_active_users(self):
        users = self.db.query("SELECT * FROM users WHERE active = 1")
        # fix: handle empty result + reverse sort for most recent first
        if not users:
            return []
        return sorted(users, key=lambda u: u['last_login'], reverse=True)`,
  explain: `• A simple ORM-style service that queries users from a database with an in-memory cache layer for repeated lookups by ID.
• Contains SQL injection vulnerabilities — user_id is concatenated directly into query strings instead of using parameterized queries.
• The delete method doesn't invalidate the cache, so get_user() will return stale data for deleted users. get_active_users() sorts by last_login ascending (oldest first) which is likely backwards.`,
  commit: `fix: patch SQL injection and cache invalidation in UserService

- Replace string concatenation with parameterized queries in get_user and delete_user
- Invalidate cache entry on delete to prevent stale reads
- Guard against empty result in get_active_users, sort most-recent-first`,
  test: `import pytest
from unittest.mock import MagicMock
from user_service import UserService

@pytest.fixture
def service():
    db = MagicMock()
    return UserService(db)

def test_get_user_queries_db(service):
    service.db.query.return_value = {"id": "1", "name": "Alice"}
    assert service.get_user("1")["name"] == "Alice"

def test_get_user_uses_cache(service):
    service.db.query.return_value = {"id": "1", "name": "Alice"}
    service.get_user("1")
    service.get_user("1")
    assert service.db.query.call_count == 1

def test_delete_user_invalidates_cache(service):
    service.cache["1"] = {"id": "1", "name": "Alice"}
    service.delete_user("1")
    assert "1" not in service.cache

def test_get_active_users_empty(service):
    service.db.query.return_value = []
    assert service.get_active_users() == []

def test_get_active_users_sorted_recent_first(service):
    service.db.query.return_value = [
        {"last_login": "2024-01-01"}, {"last_login": "2024-06-01"}
    ]
    result = service.get_active_users()
    assert result[0]["last_login"] == "2024-06-01"`,
};
