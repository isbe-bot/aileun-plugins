const SOURCE_TYPES = new Set(['local', 'github', 'registry']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pushError(errors, path, message) {
  errors.push({ path, message });
}

function validateStringArray(input, key, errors) {
  if (!Array.isArray(input[key]) || input[key].some((v) => typeof v !== 'string' || v.trim() === '')) {
    pushError(errors, key, `${key} must be an array of non-empty strings`);
  }
}

export function validatePluginManifest(input) {
  const errors = [];

  if (!isObject(input)) {
    return { ok: false, errors: [{ path: '$', message: 'plugin manifest must be an object' }] };
  }

  if (typeof input.schema_version !== 'string' || input.schema_version.trim() === '') {
    pushError(errors, 'schema_version', 'schema_version is required and must be a non-empty string');
  }

  if (typeof input.plugin_id !== 'string' || !/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/.test(input.plugin_id)) {
    pushError(errors, 'plugin_id', 'plugin_id is required and should look like namespace.name (lowercase)');
  }

  if (typeof input.name !== 'string' || input.name.trim() === '') {
    pushError(errors, 'name', 'name is required and must be a non-empty string');
  }

  if (typeof input.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(input.version)) {
    pushError(errors, 'version', 'version is required and must be semver-like (e.g. 1.0.0)');
  }

  if (!isObject(input.source)) {
    pushError(errors, 'source', 'source is required and must be an object');
  } else {
    if (typeof input.source.type !== 'string' || !SOURCE_TYPES.has(input.source.type)) {
      pushError(errors, 'source.type', `source.type must be one of: ${Array.from(SOURCE_TYPES).join(', ')}`);
    }
    if (typeof input.source.uri !== 'string' || input.source.uri.trim() === '') {
      pushError(errors, 'source.uri', 'source.uri is required and must be a non-empty string');
    }
  }

  if (typeof input.description !== 'string' || input.description.trim() === '') {
    pushError(errors, 'description', 'description is required and must be a non-empty string');
  }

  validateStringArray(input, 'provides', errors);
  validateStringArray(input, 'tools', errors);
  validateStringArray(input, 'required_permissions', errors);
  validateStringArray(input, 'required_config', errors);
  validateStringArray(input, 'required_secrets', errors);

  if (!isObject(input.health_check)) {
    pushError(errors, 'health_check', 'health_check is required and must be an object');
  } else {
    if (typeof input.health_check.type !== 'string' || input.health_check.type.trim() === '') {
      pushError(errors, 'health_check.type', 'health_check.type is required and must be a non-empty string');
    }
    if (typeof input.health_check.endpoint !== 'string' || input.health_check.endpoint.trim() === '') {
      pushError(
        errors,
        'health_check.endpoint',
        'health_check.endpoint is required and must be a non-empty string',
      );
    }
  }

  if (typeof input.safe_to_disable !== 'boolean') {
    pushError(errors, 'safe_to_disable', 'safe_to_disable is required and must be a boolean');
  }

  if (typeof input.rollback_supported !== 'boolean') {
    pushError(errors, 'rollback_supported', 'rollback_supported is required and must be a boolean');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    manifest: {
      schema_version: input.schema_version,
      plugin_id: input.plugin_id,
      name: input.name,
      version: input.version,
      source: {
        type: input.source.type,
        uri: input.source.uri,
      },
      description: input.description,
      provides: input.provides,
      tools: input.tools,
      required_permissions: input.required_permissions,
      required_config: input.required_config,
      required_secrets: input.required_secrets,
      health_check: {
        type: input.health_check.type,
        endpoint: input.health_check.endpoint,
      },
      safe_to_disable: input.safe_to_disable,
      rollback_supported: input.rollback_supported,
    },
  };
}
