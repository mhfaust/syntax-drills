import { parse } from 'yaml';
import { z } from 'zod';
import type { ContentPack, ExerciseTemplate, Skill } from '@/core/model/content';

/*
 * Loads a Python content pack: one skills.yaml, any number of template YAML files, and one
 * Markdown overview per skill at overviews/<skill-id>.md.
 * Ids in YAML are short ('enumerate'); here they get the language prefix ('python/enumerate').
 */

export const PYTHON = 'python';
const ns = (id: string) => `${PYTHON}/${id}`;

const skillsFileSchema = z.object({
  pack: z.string(),
  version: z.number().int(),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      group: z.string(),
      summary: z.string(),
      requires: z.array(z.string()).default([]),
    }),
  ),
  idioms: z
    .array(z.object({ flag: z.string(), skill: z.string(), message: z.string() }))
    .default([]),
});

export const pythonTemplateSpecSchema = z.object({
  id: z.string(),
  skills: z.array(z.string()).min(1),
  /** Authored difficulty, 1 (easiest) to 3. */
  level: z.number().int().min(1).max(3).default(1),
  prompt: z.string(),
  generate: z.string().default(''),
  setup: z.string().default(''),
  /** Wrap the key construct in <<...>> to make it a blank at the fill level. */
  solution: z.string(),
  check: z
    .object({
      /** Variables compared against the reference solution's. */
      vars: z.array(z.string()).default([]),
      /** Snippets run in both namespaces; the last line's value is compared. */
      calls: z.array(z.string()).default([]),
      stdout: z.boolean().default(false),
    })
    .default({ vars: [], calls: [], stdout: false }),
  /** Constructs the prompt explicitly asks for, e.g. 'call:enumerate', 'node:ListComp'. */
  require: z.array(z.string()).default([]),
  /** Idiom flags that are fine here, e.g. when the prompt asks for an explicit loop. */
  allow: z.array(z.string()).default([]),
});

export type PythonTemplateSpec = z.infer<typeof pythonTemplateSpecSchema>;

export type ContentFile = { path: string; text: string };

export function loadPythonPack(files: ContentFile[]): ContentPack {
  const skillsFile = files.find((f) => f.path.endsWith('skills.yaml'));
  if (!skillsFile) throw new Error('Python content needs a skills.yaml');
  const meta = skillsFileSchema.parse(parse(skillsFile.text));

  const overviews = new Map(
    files
      .filter((f) => f.path.endsWith('.md'))
      .map((f) => [/([^/\\]+)\.md$/.exec(f.path)![1]!, f.text]),
  );

  const skills: Skill[] = meta.skills.map((s) => ({
    id: ns(s.id),
    languageId: PYTHON,
    name: s.name,
    group: s.group,
    summary: s.summary,
    prerequisites: s.requires.map(ns),
    overview: overviews.get(s.id),
  }));

  const templates: ExerciseTemplate[] = files
    .filter((f) => f !== skillsFile && f.path.endsWith('.yaml'))
    .sort((a, b) => a.path.localeCompare(b.path))
    .flatMap((file) => {
      const raw: unknown = parse(file.text) ?? [];
      return z
        .array(pythonTemplateSpecSchema)
        .parse(raw)
        .map((spec) => ({
          id: ns(spec.id),
          languageId: PYTHON,
          skillIds: spec.skills.map(ns),
          difficulty: 850 + 125 * (spec.level - 1) + 75 * (spec.skills.length - 1),
          spec,
        }));
    });

  return {
    languageId: PYTHON,
    languageName: 'Python',
    packId: meta.pack,
    version: meta.version,
    skills,
    templates,
    idioms: meta.idioms.map((i) => ({ flag: i.flag, skillId: ns(i.skill), message: i.message })),
  };
}
