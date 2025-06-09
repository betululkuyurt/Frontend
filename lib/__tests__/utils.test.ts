import { getServiceColor } from '../service-utils';

describe('getServiceColor', () => {
  it('returns correct color for text to text', () => {
    expect(getServiceColor('text', 'text')).toBe('bg-purple-600');
  });
  it('returns correct color for text to image', () => {
    expect(getServiceColor('text', 'image')).toBe('bg-pink-600');
  });
  it('returns default color for unknown types', () => {
    expect(getServiceColor('foo', 'bar')).toBe('bg-indigo-600');
  });
});
