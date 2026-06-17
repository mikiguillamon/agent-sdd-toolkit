export function maybeFail(label) {
  if (process.env.AGENT_SDD_FAILPOINT === label) {
    throw new Error(`Injected failpoint: ${label}`);
  }
}
