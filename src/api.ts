// Public API surface for testing and programmatic use.
// Exported via dist/api.js (separate bundle from the bin).

export { scaffold, type ScaffoldResult } from './scaffold.js';
export { resolveTemplatesDir } from './paths.js';
export { resolveAnswers, runPrompts, type ScaffoldAnswers, type ExtraKey } from './prompts.js';
export { DEFAULT_DOMAINS, ADDITIONAL_DOMAIN_CATALOG, findDomainByKey } from './domains.js';
export { AGENT_TARGETS, findAgentByKey, isAgentKey, type AgentKey, type AgentTarget } from './agents.js';
export { parseArgs, isNonInteractive, type CliFlags, type ParsedArgs } from './flags.js';
