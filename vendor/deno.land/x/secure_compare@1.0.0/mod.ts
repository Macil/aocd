export default (a: string, b: string): boolean => {
  let mismatch = a.length === b.length ? 0 : 1;

  if (mismatch) b = a;

  for (let i = 0, il = a.length; i < il; ++i) {
    const ac = a.charCodeAt(i);
    const bc = b.charCodeAt(i);
    mismatch |= (ac ^ bc);
  }

  return mismatch === 0;
};
