(function () {
  const blockedKeys = [
    "toJSON",
    "toXml",
    "equal",
    "clone",
    "assign",
    "__proto__"
  ];

  const originalDefineProperty = Object.defineProperty;

  Object.defineProperty = function (obj, key, descriptor) {
    try {
      if (obj === Object.prototype) {
        if (typeof key !== "string") return obj;

        if (blockedKeys.includes(key)) return obj;

        if (!key.startsWith("_") && !key.startsWith("$")) {
          return obj;
        }
      }

      return originalDefineProperty.call(Object, obj, key, descriptor);
    } catch {
      return obj;
    }
  };
})();
