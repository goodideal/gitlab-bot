declare global {
  type Color = {
    red: string;
    green: string;
    grey: string;
  };
  type Template = {
    push: string;
    pipeline: string;
    merge_request: string;
    tag_push: string;
    issue: string;
    wiki: string;
    note: string;
    project_action: string;
    user_action: string;
  };
  type Resp = {
    path: string;
    body: any;
  };
}

export {};
