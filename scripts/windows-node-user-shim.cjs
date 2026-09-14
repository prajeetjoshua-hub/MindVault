// tsx asks for a Unix-style effective user id when choosing its temporary
// directory. Windows does not expose geteuid, and os.userInfo can fail on
// memory-constrained machines. A fixed local label keeps the cache private to
// the current Windows temp directory without reading account information.
if (process.platform === "win32" && typeof process.geteuid !== "function")
  process.geteuid = () => "mindvault-local";
