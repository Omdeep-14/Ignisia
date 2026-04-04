export const defaultState = {
  question: {
    value: (x, y) => y ?? x,
    default: () => "",
  },
  chunks: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  conflicts: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  answer: {
    value: (x, y) => y ?? x,
    default: () => "",
  },
  sources: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  crmTicket: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  org_id: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  messages: {
    value: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  },
};
