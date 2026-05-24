# Security

## Data handled

`aileun-plugins` stores local operational metadata in SQLite and canonical runtime files. Runtime data may include paths, definitions, manifest metadata, or hashes depending on the manager.

## Do not commit

- `runtime/`
- `*.sqlite`, `*.db`, WAL/SHM files
- `.env`
- `.secrets/`
- private keys or certificates
- logs containing private operational data

## Network exposure

Phase 1 has no daemon and opens no network port. It is CLI-only.

## Secrets

Secret values must not be stored in repo files. If a definition references a secret, store only the secret name/key and resolve the value through the future deployment secret mechanism.

## Reporting issues

For public reports, avoid including runtime databases, private paths, private customer data, secrets, or OpenClaw prompts/configuration.
