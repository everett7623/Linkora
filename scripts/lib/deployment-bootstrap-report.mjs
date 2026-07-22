function maskIdentifier(value) {
  if (!value) return 'not configured';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.min(12, value.length - 6))}${value.slice(-6)}`;
}

function buildBindings(config, names, resources) {
  return {
    LINKETRY_API_URL: `https://${config.domain}`,
    LINKETRY_PAGES_PROJECT: names.pages,
    LINKETRY_WORKER_NAME: names.worker,
    LINKETRY_WORKER_DOMAINS: config.domain,
    LINKETRY_D1_DATABASE_NAME: names.d1,
    LINKETRY_D1_DATABASE_ID: resources.d1.id || '<created-after-apply>',
    LINKETRY_KV_NAMESPACE_ID: resources.kv.id || '<created-after-apply>',
  };
}

function buildWranglerBindingSnippet(names, resources) {
  return [
    '[[d1_databases]]',
    'binding = "DB"',
    `database_name = "${names.d1}"`,
    `database_id = "${resources.d1.id || '<created-after-apply>'}"`,
    'migrations_dir = "../../migrations"',
    '',
    '[[kv_namespaces]]',
    'binding = "KV"',
    `id = "${resources.kv.id || '<created-after-apply>'}"`,
  ].join('\n');
}

export function buildBootstrapReport({
  config,
  confirmation,
  names,
  resources,
  errors,
  applied,
  created,
  mutationAttempted,
}) {
  const bindings = buildBindings(config, names, resources);
  const ready = Boolean(resources.d1.id && resources.kv.id && errors.length === 0);
  return {
    ok: errors.length === 0,
    mode: applied ? 'apply' : 'dry-run',
    accountId: maskIdentifier(config.accountId),
    prefix: config.prefix,
    domain: config.domain,
    location: config.location || 'automatic',
    confirmation,
    resources: {
      d1: {
        name: names.d1,
        id: resources.d1.id || '',
        action: resources.d1.exists ? 'reuse' : applied ? 'unresolved' : 'create',
      },
      kv: {
        name: names.kv,
        id: resources.kv.id || '',
        action: resources.kv.exists ? 'reuse' : applied ? 'unresolved' : 'create',
      },
      worker: { name: names.worker, action: 'binding output only' },
      pages: { name: names.pages, action: 'binding output only' },
    },
    created,
    mutationAttempted,
    mutationPerformed: created.length > 0,
    bindingOutputReady: ready,
    bindings,
    wranglerToml: buildWranglerBindingSnippet(names, resources),
    requiredSecrets: [
      'CLOUDFLARE_ACCOUNT_ID (reuse the selected value; not printed)',
      'CLOUDFLARE_API_TOKEN (CI only; never printed)',
    ],
    optionalNextResources: [
      'KV preview namespace',
      'R2 backup buckets',
      'Queue',
      'extra domains',
      'advanced Cron',
    ],
    errors,
  };
}
