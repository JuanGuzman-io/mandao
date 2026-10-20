/**
 * What `mandao run` scripts print for the agent that called them. Compact by default: every byte lands in
 * the Leader's context on every call; `MANDAO_JSON=pretty` indents it for people.
 */
export const json = (value: unknown) =>
  console.log(process.env.MANDAO_JSON === 'pretty' ? JSON.stringify(value, null, 2) : JSON.stringify(value));
