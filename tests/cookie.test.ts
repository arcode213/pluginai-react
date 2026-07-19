import {
  clearConversationId,
  getConversationId,
  setConversationId,
} from '../src/utils/cookie';

describe('cookie helpers', () => {
  it('getConversationId returns null when no cookie is set', () => {
    expect(getConversationId()).toBeNull();
  });

  it('setConversationId stores a value that is readable afterwards', () => {
    setConversationId('conv_abc123456789');
    expect(getConversationId()).toBe('conv_abc123456789');
  });

  it('clearConversationId removes the cookie', () => {
    setConversationId('conv_abc123456789');
    clearConversationId();
    expect(getConversationId()).toBeNull();
  });

  it('round-trips ids containing characters that need encoding', () => {
    setConversationId('conv_a b;c');
    expect(getConversationId()).toBe('conv_a b;c');
  });

  it('does not confuse a different cookie with the same suffix', () => {
    document.cookie = 'other_pluginai_conversation_id=decoy; path=/';
    expect(getConversationId()).toBeNull();
  });
});
