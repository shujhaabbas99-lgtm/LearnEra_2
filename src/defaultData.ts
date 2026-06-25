import { Curriculum } from "./types";

export const DEFAULT_CURRICULA = (userId: string): Curriculum[] => [
  {
    id: "demo-frontend-react",
    userId: userId,
    title: "Vite + React Systems Architecture",
    description: "Master modern user interfaces, visual design systems, state engines, and performance scaling with React 19.",
    category: "Technology",
    createdAt: new Date().toISOString(),
    targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    modules: [
      {
        id: "demo-m1",
        title: "Module 1: Functional Components & Hooks State Layout",
        description: "Deconstruct render processes, design high-fidelity components, and regulate re-renders with stabilized primitives.",
        lessons: [
          {
            id: "demo-m1-l1",
            title: "Primitive State Optimization",
            description: "Deep dive into state stabilization, dependency array safety, and hook lifecycle execution.",
            notes: "Stable component lifecycles yield highly performant interfaces.",
            estimatedMinutes: 45,
            completed: true,
            tasks: [
              { id: "demo-m1-l1-t1", text: "Read core documentation on state primitives and dependency stabilization.", completed: true },
              { id: "demo-m1-l1-t2", text: "Refactor a bloated single-hook component into microfunctional elements.", completed: true },
              { id: "demo-m1-l1-t3", text: "Benchmark render frequencies using React Profiler tools.", completed: true }
            ]
          },
          {
            id: "demo-m1-l2",
            title: "Custom Event Handlers and Listeners",
            description: "Configure clean events, resize observers, and debounced window properties for canvas widgets.",
            notes: "",
            estimatedMinutes: 60,
            completed: false,
            tasks: [
              { id: "demo-m1-l2-t1", text: "Implement a ResizeObserver inside standard React state refs.", completed: false },
              { id: "demo-m1-l2-t2", text: "Stray away from raw window logic and build event subscription utilities.", completed: false },
              { id: "demo-m1-l2-t3", text: "Test window boundary resize delays under throttled CPU conditions.", completed: false }
            ]
          }
        ]
      },
      {
        id: "demo-m2",
        title: "Module 2: Structured Animation & Page Cohesion",
        description: "Animate visual rhythms, model screen transitions under spring matrices, and organize layout headers.",
        lessons: [
          {
            id: "demo-m2-l1",
            title: "Micro-Transitions & Spring Mechanics",
            description: "Deploy elegant hover indicators, spring curves, and content entrances using motion.",
            notes: "Micro-animations shouldn't feel erratic, but should guide attention gracefully.",
            estimatedMinutes: 30,
            completed: false,
            tasks: [
              { id: "demo-m2-l1-t1", text: "Integrate spring transitions onto hover card state changes.", completed: false },
              { id: "demo-m2-l1-t2", text: "Avoid standard CSS animations and style microfunctional elements.", completed: false }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "demo-ai-engineering",
    userId: userId,
    title: "Applied AI Engineer: System Prompting & Orchestration",
    description: "Learn how to build full-stack interfaces targeting LLMs, construct strict JSON schemas, and structure system endpoints.",
    category: "Technology",
    createdAt: new Date().toISOString(),
    targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    modules: [
      {
        id: "demo-ai-m1",
        title: "Module 1: Strict JSON Schema Boundaries",
        description: "Instruct Gemini to deliver raw formatted response blocks conforming to specific domain matrices.",
        lessons: [
          {
            id: "demo-ai-m1-l1",
            title: "Grammar & Schema Prompting",
            description: "Author comprehensive system prompts that force structured JSON responses without wrapper debris.",
            notes: "Valid parsed schemas require sanitizing wrapper markdown characters.",
            estimatedMinutes: 60,
            completed: false,
            tasks: [
              { id: "demo-ai-m1-l1-t1", text: "Draft an object validation constraint for a curriculum tree.", completed: false },
              { id: "demo-ai-m1-l1-t2", text: "Build server-side error catches to recover from malformed JSON blocks.", completed: false }
            ]
          }
        ]
      }
    ]
  }
];
