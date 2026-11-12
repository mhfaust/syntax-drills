import { useState } from 'react';
import type { Nav } from '@/app/header/AppHeader';
import { HomeScreen } from '@/app/home/HomeScreen';
import { ReferenceScreen } from '@/app/reference/ReferenceScreen';
import { SessionScreen } from '@/app/session/SessionScreen';
import type { SessionMode } from '@/app/session/useDrillSession';
import { SkillsScreen } from '@/app/skills/SkillsScreen';
import { SummaryScreen } from '@/app/summary/SummaryScreen';
import { useLearner } from '@/app/useLearner';
import type { SessionSummary } from '@/core/engine/summary';
import type { SkillId } from '@/core/model/ids';

type Screen =
  | { name: 'home' }
  | { name: 'session'; mode: SessionMode }
  | { name: 'summary'; summary: SessionSummary }
  | { name: 'skills' }
  | { name: 'reference'; skillId?: SkillId; from: 'home' | 'skills' };

export function App() {
  const learner = useLearner();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const home = () => setScreen({ name: 'home' });
  const nav: Nav = {
    home,
    skills: () => setScreen({ name: 'skills' }),
    reference: () => setScreen({ name: 'reference', from: 'home' }),
  };

  if (!learner.state) return null;

  switch (screen.name) {
    case 'home':
      return (
        <HomeScreen
          learner={learner}
          nav={nav}
          onStart={(mode) => setScreen({ name: 'session', mode })}
        />
      );
    case 'session':
      return (
        <SessionScreen
          mode={screen.mode}
          learner={learner}
          onFinish={(summary) => setScreen({ name: 'summary', summary })}
        />
      );
    case 'summary':
      return (
        <SummaryScreen
          summary={screen.summary}
          onDone={home}
        />
      );
    case 'skills':
      return (
        <SkillsScreen
          learner={learner}
          nav={nav}
          onOverview={(skillId) => setScreen({ name: 'reference', skillId, from: 'skills' })}
        />
      );
    case 'reference':
      return (
        <ReferenceScreen
          learner={learner}
          skillId={screen.skillId}
          nav={nav}
          onBack={screen.from === 'skills' ? () => setScreen({ name: 'skills' }) : home}
        />
      );
  }
}
