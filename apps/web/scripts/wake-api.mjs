const base = process.env.NEXT_PUBLIC_API_URL;
if (!base) {
  console.error(
    'API_URL is not set — check apps/web/.env.local or the hosting env vars',
  );
  process.exit(1);
}

const url = new URL('/health', base).toString();
console.log(`Waking API: ${url}`);

for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (res.ok) {
      console.log(`API is awake (attempt ${attempt})`);
      process.exit(0);
    }
    console.log(`Attempt ${attempt}: HTTP ${res.status}`);
  } catch (error) {
    console.log(
      `Attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

console.error(`API did not wake up: ${url}`);
process.exit(1);
