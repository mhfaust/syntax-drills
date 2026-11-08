import { createContext, useContext, type ReactNode } from 'react';
import type { Engine } from '@/core/engine/engine';
import type { EventBus } from '@/core/events';
import type { ContentPack } from '@/core/model/content';
import type { Clock } from '@/core/ports/clock';
import type { Learner } from '@/core/ports/identity';
import type { LanguageRuntime } from '@/core/ports/language';
import type { AttemptStore } from '@/core/ports/stores';

/**
 * Everything the UI depends on, typed by ports only. The concrete implementations are
 * chosen in src/composition-root.ts; the app never imports them directly.
 */
export type AppServices = {
  learner: Learner;
  content: ContentPack;
  engine: Engine;
  runtime: LanguageRuntime;
  attempts: AttemptStore;
  events: EventBus;
  clock: Clock;
};

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({
  services,
  children,
}: {
  services: AppServices;
  children: ReactNode;
}) {
  return <ServicesContext value={services}>{children}</ServicesContext>;
}

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside ServicesProvider');
  return services;
}
