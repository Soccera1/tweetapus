// Read authToken from localStorage at request time to avoid stale module-level values

// this is mostly a foundation to build upon
// for easier further optimizations

function hash(str) {
  let h = 2166136261n;
  for (let i = 0; i < str.length; i++) {
    h ^= BigInt(str.charCodeAt(i));
    h *= 16777619n;
  }
  const hex = h.toString(16);

  if (hex.length > 32) return hex.slice(0, 32);
  return hex.padStart(32, "0");
}

export default async (url, options = {}) => {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`/api${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "X-Request-Token": hash(token || "public"),
      },
    });

    // Try to parse JSON; if parsing fails, fall back to text
    let parsed = null;
    try {
      parsed = await res.json();
    } catch (err) {
      const text = await res.text();
      parsed = text;
    }

    if (res.ok) return parsed;

    // Non-2xx: normalize to an object with error
    if (parsed && typeof parsed === "object") {
      return parsed;
    }

    return { error: String(parsed) || "Request failed" };
  } catch (err) {
    return { error: "Network error" };
  }
};
