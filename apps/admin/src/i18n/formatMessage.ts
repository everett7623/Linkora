export type MessageVariables = Record<string, string | number>;

export function formatMessage(template: string, variables: MessageVariables = {}): string {
  return Object.entries(variables).reduce(
    (text, [name, replacement]) => text.split(`{${name}}`).join(String(replacement)),
    template
  );
}
