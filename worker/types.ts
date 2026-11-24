export type AuthUser = {
  id: number,
  username: string
};

export type Env = {
  Bindings: CloudflareBindings,
  Variables: {
    user: AuthUser
  }
};