// Jest setup file
// Global test setup and configuration

global.console = {
  ...console,
  // Mock console.log during tests unless explicitly testing it
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Dummy test to prevent Jest error
describe('Jest setup', () => {
  it('should be configured correctly', () => {
    expect(true).toBe(true);
  });
});