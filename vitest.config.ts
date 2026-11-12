import { defineConfig } from 'vitest/config';

// Run in an unusual zone (UTC+13:45 in November) so any accidental use of the device zone fails tests.
process.env.TZ = 'Pacific/Chatham';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    environment: 'node',
    watch: false,
  },
});
