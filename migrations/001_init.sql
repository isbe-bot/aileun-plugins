CREATE TABLE IF NOT EXISTS plugins (
  plugin_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  current_version TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_uri TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plugin_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT NOT NULL,
  version TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_uri TEXT NOT NULL,
  checksum_sha256 TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (plugin_id, version),
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_manifests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT NOT NULL,
  version TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  manifest_hash_sha256 TEXT NOT NULL,
  source_path TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (plugin_id, version, manifest_hash_sha256),
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT NOT NULL,
  version TEXT NOT NULL,
  install_path TEXT,
  source_uri TEXT,
  checksum_sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'not_installed',
  installed_at TEXT,
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_enablements (
  plugin_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL,
  reason TEXT,
  actor_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'normal',
  required INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE (plugin_id, permission_key),
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_config_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'missing',
  created_at TEXT NOT NULL,
  CHECK (requirement_type IN ('config', 'secret')),
  UNIQUE (plugin_id, requirement_type, requirement_key),
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_tool_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  contract_json TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (plugin_id, tool_name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_consumers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT NOT NULL,
  consumer_type TEXT NOT NULL,
  consumer_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (plugin_id, consumer_type, consumer_id),
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_health_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin_id TEXT,
  status TEXT NOT NULL,
  details_json TEXT,
  observed_at TEXT NOT NULL,
  FOREIGN KEY (plugin_id) REFERENCES plugins(plugin_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS plugin_events (
  event_id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  reason TEXT,
  before_hash TEXT,
  after_hash TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plugin_versions_plugin ON plugin_versions(plugin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_manifests_plugin ON plugin_manifests(plugin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_permissions_plugin ON plugin_permissions(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_config_req_plugin ON plugin_config_requirements(plugin_id, requirement_type);
CREATE INDEX IF NOT EXISTS idx_plugin_tools_plugin ON plugin_tool_contracts(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_consumers_plugin ON plugin_consumers(plugin_id, consumer_type);
CREATE INDEX IF NOT EXISTS idx_plugin_health_plugin ON plugin_health_snapshots(plugin_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_events_resource ON plugin_events(resource_type, resource_id, created_at DESC);
