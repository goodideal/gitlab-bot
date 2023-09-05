const OBJECT_KIND = {
  push: 'push',
  tag_push: 'tag_push',
  issue: 'issue',
  note: 'note',
  merge_request: 'merge_request',
  wiki_page: 'wiki_page',
  pipeline: 'pipeline',
  build: 'build', // todo
};

const EVENT_TYPE = {
  group_create: 'group_create',
  group_destroy: 'group_destroy',
  group_rename: 'group_rename',
  key_create: 'key_create',
  key_destroy: 'key_destroy',
  project_create: 'project_create',
  project_destroy: 'project_destroy',
  project_rename: 'project_rename',
  project_transfer: 'project_transfer',
  project_update: 'project_update',
  repository_update: 'repository_update',
  user_add_to_group: 'user_add_to_group',
  user_add_to_team: 'user_add_to_team',
  user_create: 'user_create',
  user_destroy: 'user_destroy',
  user_failed_login: 'user_failed_login',
  user_remove_from_group: 'user_remove_from_group',
  user_remove_from_team: 'user_remove_from_team',
  user_rename: 'user_rename',
  user_update_for_group: 'user_update_for_group',
  user_update_for_team: 'user_update_for_team',
};

const X_GITLAB_EVENT = {
  push: 'Push Hook',
  system: 'System Hook',
};

module.exports = { OBJECT_KIND, EVENT_TYPE, X_GITLAB_EVENT };
