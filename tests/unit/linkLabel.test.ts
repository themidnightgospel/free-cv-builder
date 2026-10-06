import { describe, expect, it } from 'vitest';
import { getLinkDisplayName } from '../../src/utils/linkLabel';

describe('getLinkDisplayName', () => {
  it('shows only the domain of a full URL', () => {
    expect(
      getLinkDisplayName(
        'https://www.toptal.com/developers/resume/bitchiko-tchelidze',
      ),
    ).toBe('toptal.com');
  });

  it('accepts addresses typed without a protocol', () => {
    expect(getLinkDisplayName('linkedin.com/in/someone/')).toBe('linkedin.com');
  });

  it('keeps subdomains other than www', () => {
    expect(getLinkDisplayName('https://someone.github.io/portfolio')).toBe(
      'someone.github.io',
    );
  });

  it('falls back to the text as typed when it is not a URL', () => {
    expect(getLinkDisplayName('  not a url  ')).toBe('not a url');
  });
});
