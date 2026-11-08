import { useState } from 'react';
import { HomeScreen } from '@/app/home/HomeScreen';
import { SessionScreen } from '@/app/session/SessionScreen';
import type { SessionMode } from '@/app/session/useDrillSession';
import { SkillsScreen } from '@/app/skills/SkillsScreen';
import { SummaryScreen } from '@/app/summary/SummaryScreen';
import { useLearner } from '@/app/useLearner';
import type { SessionSummary } from '@/core/engine/summary';

type Screen =
  | { name: 'home' }
  | { name: 'session'; mode: SessionMode }
  | { name: 'summary'; summary: SessionSummary }
  | { name: 'skills' };

export function App() {
  const learner = useLearner();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const home = () => setScreen({ name: 'home' });

  if (!learner.state) return null;

  switch (screen.name) {
    case 'home':
      return (
        <HomeScreen
          learner={learner}
          onStart={(mode) => setScreen({ name: 'session', mode })}
          onSkills={() => setScreen({ name: 'skills' })}
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
          onBack={home}
        />
      );
  }
}
