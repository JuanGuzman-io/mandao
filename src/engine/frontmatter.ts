import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';

/**
 * The only front matter parser. gray-matter picks the engine from the opening fence, and its `---js` /
 * `---coffee` engines `eval` the block: a cloned repository could run code when Mandao reads one of its
 * files (agent files, specs, overrides). Here only YAML and JSON are parsed. YAML goes through `yaml`
 * (YAML 1.2, alias limits, timestamps stay strings); any other fence is an error, never evaluated.
 */
const refuse = (language: string) => () => {
  throw new Error(`front matter in ${language} is not allowed: Mandao reads only YAML or JSON front matter`);
};

const OPTIONS = {
  language: 'yaml',
  engines: {
    yaml: (text: string) => (parseYaml(text) ?? {}) as object,
    javascript: refuse('javascript'),
    coffee: refuse('coffee'),
  },
};

export interface Frontmatter {
  data: Record<string, unknown>;
  content: string;
}

export function parseFrontmatter(text: string): Frontmatter {
  const { data, content } = matter(text, OPTIONS);
  return { data: data as Record<string, unknown>, content };
}
