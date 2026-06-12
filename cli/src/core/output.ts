export interface AixIssue {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  fixCommand?: string;
}

export interface AixAction {
  type: string;
  description: string;
  command?: string;
  path?: string;
  target?: string;
}

export interface AixNextAction {
  description: string;
  command?: string;
  manual?: boolean;
}

export interface AixResponse<T = unknown> {
  ok: boolean;
  data?: T;
  issues?: AixIssue[];
  actions?: AixAction[];
  nextActions?: AixNextAction[];
}

export function printResponse<T>(response: AixResponse<T>, json = false, text?: string): void {
  if (json) {
    console.log(JSON.stringify(response, null, 2));
    return;
  }
  if (text) {
    console.log(text);
    return;
  }
  if (response.issues?.length) {
    for (const issue of response.issues) {
      console.log(`${issue.severity}: ${issue.message}${issue.fixCommand ? `\n  fix: ${issue.fixCommand}` : ""}`);
    }
  }
  if (response.actions?.length) {
    for (const [index, action] of response.actions.entries()) {
      console.log(`${index + 1}. ${action.description}${action.command ? `\n   ${action.command}` : ""}`);
    }
  }
  if (response.nextActions?.length) {
    console.log("Next actions:");
    for (const action of response.nextActions) {
      console.log(`- ${action.description}${action.command ? `: ${action.command}` : ""}`);
    }
  }
}

export function targetList(all: boolean | undefined, target: string | undefined, allTargets: string[]): string[] {
  return all ? allTargets : [target ?? allTargets[0]];
}
