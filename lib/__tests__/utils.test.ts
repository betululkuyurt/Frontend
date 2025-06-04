import { getColorForService } from '../utils';

describe('getColorForService', () => {
  it('returns correct color for text to text', () => {
    expect(getColorForService('text', 'text')).toBe('from-purple-600 to-purple-800');
  });
  it('returns correct color for text to image', () => {
    expect(getColorForService('text', 'image')).toBe('from-pink-600 to-pink-800');
  });
  it('returns default color for unknown types', () => {
    expect(getColorForService('foo', 'bar')).toBe('from-indigo-600 to-indigo-800');
  });
});
