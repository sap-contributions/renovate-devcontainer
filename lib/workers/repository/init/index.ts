import { RenovateConfig } from '../../../config';
import { logger } from '../../../logger';
import { platform } from '../../../platform';
import * as memCache from '../../../util/cache/memory';
import * as repositoryCache from '../../../util/cache/repository';
import { setBranchPrefix } from '../../../util/git';
import { checkIfConfigured } from '../configured';
import { checkOnboardingBranch } from '../onboarding/branch';
import { initApis } from './apis';
import { mergeRenovateConfig } from './config';
import { detectSemanticCommits } from './semantic';
import { detectVulnerabilityAlerts } from './vulnerability';

export async function initRepo(input: RenovateConfig): Promise<RenovateConfig> {
  memCache.init();
  await repositoryCache.initialize(input);
  let config: RenovateConfig = {
    ...input,
    errors: [],
    warnings: [],
    branchList: [],
  };
  config = await initApis(config);
  config.semanticCommits = await detectSemanticCommits(config);
  config.baseBranch = config.defaultBranch;
  config.baseBranchSha = await platform.setBaseBranch(config.baseBranch);
  config = await checkOnboardingBranch(config);
  config = await mergeRenovateConfig(config);
  checkIfConfigured(config);
  await setBranchPrefix(config.branchPrefix);
  config = await detectVulnerabilityAlerts(config);
  // istanbul ignore if
  if (config.printConfig) {
    logger.debug({ config }, 'Full resolved config including presets');
  }
  return config;
}
